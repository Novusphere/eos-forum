import EOSFormat from "eosjs/lib/format";

export default class EOSBinaryReader {

    constructor(hex) {
        var bytes = new Uint8Array(hex.length / 2);
        for (var i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }

        this.bytes = bytes;
        this.offset = 0;
    }

    readByte() {
        return this.bytes[this.offset++];
    }

    readBytes(len) {
        var result = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            result[i] = this.readByte();
        }
        return result;
    }

    readInt32() {
        return (this.readByte()) |
            (this.readByte() << 8) |
            (this.readByte() << 16) |
            (this.readByte() << 24);
    }

    readVarInt() {
        const MSB = 0x80;
        const REST = 0x7f;

        var res = 0;
        var shift = 0;

        for (var i = 0; i < 8; i++) {
            var b = this.readByte();
            res +=
                shift < 28
                    ? (b & REST) << shift
                    : (b & REST) * (Math.pow(2, shift) | 0);
            shift += 7;
            if (b < MSB) break;
        }

        return res;
    }

    readString() {
        var len = this.readVarInt();
        var bytes = this.readBytes(len);
        return String.fromCharCode.apply(null, bytes);
    }

    readName() {
        var bytes = this.readBytes(8);
        var str = '';
        for (var i = 0; i < bytes.length; i++)
            str += ((bytes[i] <= 0x0f) ? '0' : '') + bytes[i].toString(16);
        return EOSFormat.decodeNameHex(str);
    }
};