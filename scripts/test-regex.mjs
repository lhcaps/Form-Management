// Test regex with /s flag
const testStr = 'something\nsetMessage(\n"Đã lưu dữ liệu"\n)';
const regex1 = /\n(\s*)setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/;
const regex2 = /\n(\s*)setMessage\s*\(\s*["'][^"]*Đã lưu[^"]*["']\s*\)/s;
console.log('Without /s:', regex1.test(testStr));
console.log('With /s:', regex2.test(testStr));
