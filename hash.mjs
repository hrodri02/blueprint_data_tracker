export function hash(data) {
    const json = JSON.stringify(data);
    let hex = "";
    let hexChars = "0123456789abcdef";
    for (let i = 0; i < json.length; i++) {
        let c = json.charCodeAt(i);
        hex += (
        hexChars.charAt((c >>> 4) & 0x0f) +
        hexChars.charAt(c & 0x0f));
    }
    return hex;
}