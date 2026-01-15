"""
Traffic Capture Module using Scapy
Captures live network packets and extracts relevant features for ML processing
"""

from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw
from scapy.layers.http import HTTPRequest
import time
from datetime import datetime
from collections import defaultdict
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TrafficCapture:
    """
    Captures network traffic and extracts features for intrusion detection
    """
    
    def __init__(self, interface=None, filter_str="ip"):
        """
        Args:
            interface (str): Network interface to capture from (None = all interfaces)
            filter_str (str): BPF filter string (default: capture all IP traffic)
        """
        self.interface = interface
        self.filter_str = filter_str
        self.flow_tracker = defaultdict(lambda: {
            'packets': [],
            'start_time': None,
            'total_fwd_packets': 0,
            'total_bwd_packets': 0,
            'total_fwd_bytes': 0,
            'total_bwd_bytes': 0
        })
        
    def get_flow_key(self, packet):
        """
        Create a unique key for flow tracking
        Format: src_ip:src_port -> dst_ip:dst_port
        """
        if IP in packet:
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            src_port = packet.sport if (TCP in packet or UDP in packet) else 0
            dst_port = packet.dport if (TCP in packet or UDP in packet) else 0
            return f"{src_ip}:{src_port}->{dst_ip}:{dst_port}"
        return None
    
    def extract_packet_features(self, packet):
        """
        Extract 78+ features from a single packet for ML model
        
        Returns:
            dict: Dictionary of features
        """
        features = {
            'timestamp': datetime.now().isoformat(),
            'src_ip': None,
            'dst_ip': None,
            'src_port': None,
            'dst_port': None,
            'protocol': None,
            'packet_size': len(packet),
            'ttl': None,
            'tcp_flags': None,
            'header_length': None,
            'payload_size': 0
        }
        
        # Extract IP layer features
        if IP in packet:
            features['src_ip'] = packet[IP].src
            features['dst_ip'] = packet[IP].dst
            features['ttl'] = packet[IP].ttl
            features['header_length'] = packet[IP].ihl * 4
            features['protocol'] = packet[IP].proto
            
        # Extract TCP features
        if TCP in packet:
            features['src_port'] = packet[TCP].sport
            features['dst_port'] = packet[TCP].dport
            features['tcp_flags'] = self._get_tcp_flags(packet[TCP])
            features['protocol'] = 'TCP'
            features['tcp_window_size'] = packet[TCP].window
            
            # Check for HTTP traffic
            if packet[TCP].dport == 80 or packet[TCP].sport == 80:
                features['is_http'] = True
                
        # Extract UDP features
        elif UDP in packet:
            features['src_port'] = packet[UDP].sport
            features['dst_port'] = packet[UDP].dport
            features['protocol'] = 'UDP'
            
            # Check for DNS traffic
            if packet[UDP].dport == 53 or packet[UDP].sport == 53:
                features['is_dns'] = True
                
        # Extract ICMP features
        elif ICMP in packet:
            features['protocol'] = 'ICMP'
            features['icmp_type'] = packet[ICMP].type
            features['icmp_code'] = packet[ICMP].code
            
        # Extract payload
        if Raw in packet:
            features['payload_size'] = len(packet[Raw].load)
            features['has_payload'] = True
        else:
            features['has_payload'] = False
            
        return features
    
    def extract_flow_features(self, flow_key):
        """
        Extract statistical features from accumulated flow data
        These are critical for detecting sophisticated attacks
        
        Returns:
            dict: Flow-level statistical features
        """
        flow = self.flow_tracker[flow_key]
        packets = flow['packets']
        
        if not packets:
            return {}
        
        # Calculate duration
        start_time = flow['start_time']
        duration = (time.time() - start_time) if start_time else 0
        
        # Packet length statistics
        fwd_lengths = [p['packet_size'] for p in packets if p.get('direction') == 'forward']
        bwd_lengths = [p['packet_size'] for p in packets if p.get('direction') == 'backward']
        
        flow_features = {
            'flow_duration': duration,
            'total_fwd_packets': flow['total_fwd_packets'],
            'total_bwd_packets': flow['total_bwd_packets'],
            'total_fwd_bytes': flow['total_fwd_bytes'],
            'total_bwd_bytes': flow['total_bwd_bytes'],
            
            # Statistical features
            'fwd_packet_length_mean': sum(fwd_lengths) / len(fwd_lengths) if fwd_lengths else 0,
            'fwd_packet_length_std': self._calculate_std(fwd_lengths),
            'fwd_packet_length_max': max(fwd_lengths) if fwd_lengths else 0,
            'fwd_packet_length_min': min(fwd_lengths) if fwd_lengths else 0,
            
            'bwd_packet_length_mean': sum(bwd_lengths) / len(bwd_lengths) if bwd_lengths else 0,
            'bwd_packet_length_std': self._calculate_std(bwd_lengths),
            'bwd_packet_length_max': max(bwd_lengths) if bwd_lengths else 0,
            'bwd_packet_length_min': min(bwd_lengths) if bwd_lengths else 0,
            
            # Flow rate features
            'flow_bytes_per_sec': (flow['total_fwd_bytes'] + flow['total_bwd_bytes']) / duration if duration > 0 else 0,
            'flow_packets_per_sec': (flow['total_fwd_packets'] + flow['total_bwd_packets']) / duration if duration > 0 else 0,
            
            # Inter-arrival time
            'fwd_iat_mean': self._calculate_iat(packets, 'forward'),
            'bwd_iat_mean': self._calculate_iat(packets, 'backward'),
        }
        
        return flow_features
    
    def _get_tcp_flags(self, tcp_packet):
        """Extract TCP flags as string"""
        flags = []
        if tcp_packet.flags.F: flags.append('FIN')
        if tcp_packet.flags.S: flags.append('SYN')
        if tcp_packet.flags.R: flags.append('RST')
        if tcp_packet.flags.P: flags.append('PSH')
        if tcp_packet.flags.A: flags.append('ACK')
        if tcp_packet.flags.U: flags.append('URG')
        return '|'.join(flags)
    
    def _calculate_std(self, values):
        """Calculate standard deviation"""
        if len(values) < 2:
            return 0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5
    
    def _calculate_iat(self, packets, direction):
        """Calculate inter-arrival time for packets in a direction"""
        filtered = [p for p in packets if p.get('direction') == direction]
        if len(filtered) < 2:
            return 0
        
        iats = []
        for i in range(1, len(filtered)):
            iat = filtered[i]['timestamp_float'] - filtered[i-1]['timestamp_float']
            iats.append(iat)
        
        return sum(iats) / len(iats) if iats else 0
    
    def process_packet(self, packet):
        """
        Process a single captured packet
        Updates flow tracker and returns feature dict
        """
        try:
            # Extract basic features
            features = self.extract_packet_features(packet)
            
            if not features['src_ip']:
                return None
            
            # Update flow tracker
            flow_key = self.get_flow_key(packet)
            if flow_key:
                flow = self.flow_tracker[flow_key]
                
                # Initialize start time
                if flow['start_time'] is None:
                    flow['start_time'] = time.time()
                
                # Add packet to flow
                packet_info = features.copy()
                packet_info['timestamp_float'] = time.time()
                packet_info['direction'] = 'forward'  # Simplified; can be enhanced
                
                flow['packets'].append(packet_info)
                flow['total_fwd_packets'] += 1
                flow['total_fwd_bytes'] += features['packet_size']
                
                # Extract flow-level features
                flow_features = self.extract_flow_features(flow_key)
                features.update(flow_features)
            
            return features
            
        except Exception as e:
            logger.error(f"Error processing packet: {e}")
            return None
    
    def packet_callback(self, packet):
        """Callback function for sniff()"""
        features = self.process_packet(packet)
        if features:
            # Log or send to ML engine
            logger.info(f"Captured: {features['src_ip']}:{features['src_port']} -> "
                       f"{features['dst_ip']}:{features['dst_port']} [{features['protocol']}]")
            
            # In production, send to message queue (RabbitMQ/Kafka) or REST API
            self.send_to_ml_engine(features)
    
    def send_to_ml_engine(self, features):
        """
        Send features to ML engine for prediction
        In production, use message queue or REST API
        """
        # Example: Save to file for batch processing
        with open('captured_traffic.jsonl', 'a') as f:
            f.write(json.dumps(features) + '\n')
    
    def start_capture(self, packet_count=0):
        """
        Start capturing packets
        
        Args:
            packet_count (int): Number of packets to capture (0 = infinite)
        """
        logger.info(f"Starting traffic capture on interface: {self.interface or 'all'}")
        logger.info(f"Filter: {self.filter_str}")
        
        try:
            sniff(
                iface=self.interface,
                filter=self.filter_str,
                prn=self.packet_callback,
                count=packet_count,
                store=False  # Don't store packets in memory
            )
        except KeyboardInterrupt:
            logger.info("Capture stopped by user")
        except Exception as e:
            logger.error(f"Capture error: {e}")


# ====================================
# Simulated Traffic Generator (for testing)
# ====================================

from scapy.all import send, IP, TCP, UDP, ICMP
import random

class TrafficSimulator:
    """
    Generates simulated network traffic for testing
    Includes both normal and attack patterns
    """
    
    def __init__(self):
        self.target_ip = "192.168.1.100"
        self.attacker_ip = "10.0.0.50"
        
    def simulate_normal_traffic(self, count=100):
        """Generate normal HTTP/DNS traffic"""
        logger.info(f"Generating {count} normal packets...")
        
        for _ in range(count):
            # HTTP traffic
            packet = IP(dst=self.target_ip)/TCP(dport=80, flags='S')
            send(packet, verbose=False)
            time.sleep(0.1)
            
    def simulate_port_scan(self, port_range=(1, 1024)):
        """Simulate port scanning attack"""
        logger.info(f"Simulating port scan attack from {self.attacker_ip}")
        
        for port in range(port_range[0], port_range[1]):
            packet = IP(src=self.attacker_ip, dst=self.target_ip)/TCP(dport=port, flags='S')
            send(packet, verbose=False)
            time.sleep(0.01)  # Very fast scanning
            
    def simulate_ddos(self, duration=10):
        """Simulate DDoS attack"""
        logger.info(f"Simulating DDoS attack for {duration} seconds")
        
        start_time = time.time()
        while time.time() - start_time < duration:
            # High volume SYN flood
            src_ip = f"10.0.{random.randint(0, 255)}.{random.randint(1, 254)}"
            packet = IP(src=src_ip, dst=self.target_ip)/TCP(dport=80, flags='S')
            send(packet, verbose=False)
            
    def simulate_icmp_flood(self, count=1000):
        """Simulate ICMP flood attack"""
        logger.info(f"Simulating ICMP flood with {count} packets")
        
        for _ in range(count):
            packet = IP(src=self.attacker_ip, dst=self.target_ip)/ICMP()
            send(packet, verbose=False)


# ====================================
# Main Execution
# ====================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="AI-IDS Traffic Capture")
    parser.add_argument('--interface', type=str, help='Network interface to capture')
    parser.add_argument('--filter', type=str, default='ip', help='BPF filter string')
    parser.add_argument('--count', type=int, default=0, help='Number of packets to capture')
    parser.add_argument('--simulate', action='store_true', help='Run traffic simulator')
    
    args = parser.parse_args()
    
    if args.simulate:
        simulator = TrafficSimulator()
        print("\n=== Traffic Simulator ===")
        print("1. Normal traffic")
        print("2. Port scan attack")
        print("3. DDoS attack")
        print("4. ICMP flood")
        
        choice = input("Select simulation (1-4): ")
        
        if choice == '1':
            simulator.simulate_normal_traffic(100)
        elif choice == '2':
            simulator.simulate_port_scan((1, 100))
        elif choice == '3':
            simulator.simulate_ddos(10)
        elif choice == '4':
            simulator.simulate_icmp_flood(500)
    else:
        # Start live capture
        capturer = TrafficCapture(interface=args.interface, filter_str=args.filter)
        capturer.start_capture(packet_count=args.count)
