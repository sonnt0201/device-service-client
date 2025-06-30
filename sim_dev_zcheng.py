import random
import socket
import select
import sys
import time
import binascii
import ssl

class Zcheng:
    SCREEN_FRAME_SIZE = 32

    #                                 [DP, G, F, E, D, C, B, A]
    LED_SEGMENT_BIT_POSITION_ZCHENG = [7, 6, 5, 4, 3, 2, 1, 0]

    LED_SEGMENT_ENCODE_ZCHENG = {
        " " : "00000000",
        "" : "00000000",
        "0" : "00111111",
        "1" : "00000110",
        "2" : "01011011",
        "3" : "01001111",
        "4" : "01100110",
        "5" : "01101101",
        "6" : "01111101",
        "7" : "00000111",
        "8" : "01111111",
        "9" : "01101111",
        "C" : "00111001",
        "E" : "01111001",
        "F":"01110001",
        "L":"00111000",
        "P":"01110011",
        ".":"10000000",
        "0.":"10111111",
        "1.":"10000110",
        "2.":"11011011",
        "3.":"11001111",
        "4.":"11100110",
        "5.":"11101101",
        "6.":"11111101",
        "7.":"10000111",
        "8.":"11111111",
        "9.":"11101111",
        "C.":"10111001",
        "E.":"11111001",
        "F.":"11110001",
        "L.":"10111000",
        "P.":"11110011"
    }

    FREQ_SCREEN = 100 # Hz
    def __init__(self):
        self.sim_current_timestamp = int(time.time()*1000)

    def reset(self):
        self.sim_current_timestamp = int(time.time()*1000)

    def getScreenFrameSize(self):
        return Zcheng.SCREEN_FRAME_SIZE

    def genTimestamp(self):
        self.sim_current_timestamp += int(1000 / Zcheng.FREQ_SCREEN)
        timestamp = self.sim_current_timestamp
        return [(timestamp >> 56) & 0xFF, (timestamp >> 48) & 0xFF, (timestamp >> 40) & 0xFF, (timestamp >> 32) & 0xFF, (timestamp >> 24) & 0xFF,
                    (timestamp >> 16) & 0xFF, (timestamp >> 8) & 0xFF, timestamp & 0xFF]

    def str2num(self, str):
        strValue = Zcheng.LED_SEGMENT_ENCODE_ZCHENG[str]
        num_src = int(strValue, 2) & 0xFF

        num_dst = 0x00
        n_bit = len(Zcheng.LED_SEGMENT_BIT_POSITION_ZCHENG)
        for i in range(n_bit):
            num_dst |= ((num_src >> (n_bit - 1 - i)) & 0x01) << Zcheng.LED_SEGMENT_BIT_POSITION_ZCHENG[i]
        
        return num_dst

    def str2arr(self, str):
        arr = []

        if len(str.split('.')) >= 2:
            left_str = str.split('.')[0]
            right_str = str.split('.')[1]
            
            for i in range(len(left_str)):
                arr.append("" + left_str[i])

            arr[len(arr) - 1] += "."
            for i in range(len(right_str)):
                arr.append("" + right_str[i])
        else:
            for i in range(len(str)):
                arr.append("" + str[i])
        return arr

    def struct2arr(self,cost, volume, price):
        cost_str = cost
        volume_str = volume
        price_str = price

        if not isinstance(cost, str):
            cost_str = "{:9.2f}".format(cost)
        if not isinstance(volume, str):
            volume_str = "{:9.2f}".format(volume)
        if not isinstance(price, str):
            price_str = "{:7.2f}".format(price)

        cost_arr = self.str2arr(cost_str)
        volume_arr = self.str2arr(volume_str)
        price_arr = self.str2arr(price_str)

        arr = cost_arr + volume_arr + price_arr
        screen = arr[::-1] #reversing using list slicing

        result = []
        for i in range(len(screen)):
            result.append(self.str2num(screen[i]))
        return result

    def gen_preset_screen(self, cost, volume, price, displayTimeMs):
        n_frame = int(displayTimeMs * Zcheng.FREQ_SCREEN / 1000)
        cost_str = cost
        volume_str = volume
        price_str = price

        if not isinstance(cost, str):
            cost_str = "P{:7.0f}".format(cost)
        
        if not isinstance(volume, str):
            cost_str = "L{:7.0f}".format(volume)
        
        if not isinstance(price, str):
            price_str = "{:7.2f}".format(price)

        if cost_str == '':
            cost_str = '        '
        if volume_str == '':
            volume_str = '        '

        frames = []
        for i in range(n_frame):
            # print('gen_screen(' + str(cost_str) + ',' + str(volume_str) + ',' + str(price_str) + ')')
            frames += [22, 0] + self.genTimestamp() + self.struct2arr(cost_str, volume_str, price_str)
        return n_frame, frames
        
    def gen_screen(self,cost, volume, price):
        screen = [22, 0] + self.genTimestamp() + self.struct2arr(cost, volume, price)
        return screen

    def gen_reset_screen(self, price, displayTimeMs):
        frames = []
        n_frame = int(displayTimeMs * Zcheng.FREQ_SCREEN / 1000)
        for i in range(n_frame):
            # print('gen_screen(0, 0,' + str(price) + ')')
            frames += [22, 0] + self.genTimestamp() + self.struct2arr(0, 0, price)
        return frames

    def gen_data(self, resetScr_displayTimeMs, start_volume, end_volume, delta_volume, price, pauseScr_displayTimeMs):
        count_frame  = 0
        frames = []

        n_reset_frame = int(resetScr_displayTimeMs * Zcheng.FREQ_SCREEN / 1000)
        if n_reset_frame > 0:
            count_frame += n_reset_frame
            frames += self.gen_reset_screen(price, count_frame)
        
        volume = start_volume
        while volume < end_volume:
            volume += delta_volume
            if volume > end_volume:
                volume = end_volume
            cost = volume * price
            # print('gen_screen(' + str(cost) + ',' + str(volume) + ',' + str(price) + ')')
            frames += self.gen_screen(cost, volume, price)
            count_frame += 1

        n_pause_frame = int(pauseScr_displayTimeMs * Zcheng.FREQ_SCREEN / 1000)
        for i in range(n_pause_frame):
            frames += [22, 0] + self.genTimestamp() + self.struct2arr(cost, volume, price)
        
        count_frame += n_pause_frame
        
        print('gen to volume: ' + str(volume))
        return count_frame, frames


class Sim:
    def __init__(self, mac):
        self.macStr = mac
        self.macArr = list(bytes.fromhex(self.macStr))

        self.last_send_time = 0
        self.offset = 0

        self.delta_time = 50    #ms
        self.window = 5

        self.sock = None

        
    def connect(self, host, port, tlsEn = False):
        #Attempt connection to server
        try:
            if tlsEn:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                # Tạo SSL context
                context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
                # Tắt xác minh chứng chỉ
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE

                # Kết nối đến máy chủ
                sock.connect((host, port))

                # Bọc socket với SSL/TLS
                self.sock = context.wrap_socket(sock, server_hostname=host)
            else:
                self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.sock.connect((host, port))
        except:
            print("[ERROR] Could not make a connection to the server")
            sys.exit(0)
    
    def handshake(self):
        self.send_handshake()
        self.wait_handshake_resp()
        self.sock.setblocking(False)

    def send_handshake(self):
        payload = [0, 1, 2, 0 , 1]
        buffer = [(len(payload) >> 8) & 0xFF, len(payload) & 0xFF] + self.macArr + [0x01, 0x00, 0x00, 0x00] + payload
        self.sock.sendall(bytearray(buffer))

    def wait_handshake_resp(self):
        self.sock.settimeout(5)
        try:
            data = self.sock.recv(1024)
            print('Received:', data.hex())
        except socket.timeout:
            print("[ERROR] Timeout! No data received within 5 seconds.")
            sys.exit(0)

    def reset_sim(self):
        self.last_send_time = int(time.time()*1000)
        self.offset = 0

    def get_packet_from_frames(self, root_frames, offset_frame, max_frame, screen_frame_size):
        frames = root_frames[offset_frame * screen_frame_size : (offset_frame + max_frame) * screen_frame_size]
        return int(len(frames) / screen_frame_size), frames

    # True: send done
    def send_data(self, frames, total_frames, screen_frame_size):
        if int(time.time()*1000) - self.last_send_time >= self.delta_time:
            if self.offset < total_frames:
                count, data = self.get_packet_from_frames(frames, self.offset, self.window, screen_frame_size)
                if count == 0:
                    return True
                self.offset += count
                payload = [0, 1, (count >> 8) & 0xFF, count & 0xFF] + data
                buffer = [(len(payload) >> 8) & 0xFF, len(payload) & 0xFF] + self.macArr + [0x02, 0x00, 0x00, 0x00] + payload
                self.sock.sendall(bytearray(buffer))
                self.last_send_time = int(time.time()*1000)

                # print('\nsend---------------------------------:' + str(len(buffer)))
                # print(' '.join(f'{b:02x}' for b in buffer))
            else:
                return True
        return False

    def handle_socket(self):
        try:
            ready, _, _ = select.select([self.sock], [], [], 0)
            if ready:
                data = self.sock.recv(1024)
                print("Rx:", data.hex())
            else:
                # lam viec khac o day
                pass
        except ConnectionResetError:
            print(f"[ERROR] Disconnected!")
            self.sock.close()
    
    def close(self):
        self.sock.close()

def main():
    dev = Zcheng()
    sim = Sim('0008DC780404')

    sim.connect(host = "localhost", port = 5000, tlsEn=False)
    sim.handshake()

    isDone = True
    total_frames = 0
    frames = []
    try:
        while True:
            if isDone:
                dev.reset()
                sim.reset_sim()
                print("restart log session:" + str(total_frames) + " frames")

                total_frames = 0
                frames = []
                # init screen data 
                end_volume_random = random.randint(3, 40)
                cnt, f = dev.gen_data(resetScr_displayTimeMs = 100, start_volume = 0, end_volume = end_volume_random, delta_volume = 0.01, price = 20.0, pauseScr_displayTimeMs = 6000)
                total_frames += cnt
                frames += f

                # cnt, f = dev.gen_data(resetScr_displayTimeMs = 0, start_volume = 5.0, end_volume = 10.0, delta_volume = 0.01, price = 20.0, pauseScr_displayTimeMs = 1000)
                # total_frames += cnt
                # frames += f

                cnt, f = dev.gen_preset_screen(cost='', volume= 10.0, price= 20.0, displayTimeMs = 2000)
                total_frames += cnt
                frames += f
                
            isDone = sim.send_data(frames, total_frames, dev.getScreenFrameSize())

            sim.handle_socket()

            time.sleep(0.001)
    except:
        sim.close()
        

if __name__ == "__main__":
    main()