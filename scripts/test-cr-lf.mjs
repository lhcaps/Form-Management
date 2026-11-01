// Test with \r\n
const testStr = 'something\r\nsetMessage(\r\n"Đã lưu dữ liệu"\r\n)';
const regex1 = /\n(\s*)setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/;
const regex2 = /\n(\s*)setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/s;
console.log('Without /s:', regex1.test(testStr));
console.log('With /s:', regex2.test(testStr));
// Also try with \r?\n in pattern
const regex3 = /\r?\n(\s*)setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/s;
console.log('With \\r?\\n and /s:', regex3.test(testStr));
