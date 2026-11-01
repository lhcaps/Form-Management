import { readFileSync } from 'node:fs';

const b = readFileSync(
  'docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_BEFORE_TEXT.latest.txt',
  'utf8',
);
const a = readFileSync(
  'docs/audit/bm171-runtime-preview-parity/BM171_RUNTIME_PREVIEW_AFTER_TEXT.latest.txt',
  'utf8',
);

console.log('BEFORE length:', b.length);
console.log('AFTER length: ', a.length);

const forbidden = [
  'Căn cứ Điều 41',
  'Cá nhân/Tổ chức',
  'Tài sản theo quy định',
  'Mô tả vụ việc mẫu',
  'Mô tả vụ án mẫu',
];

for (const frag of forbidden) {
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escapeRe(frag), 'g');
  const bCount = (b.match(re) ?? []).length;
  const aCount = (a.match(re) ?? []).length;
  console.log(`'${frag}': BEFORE=${bCount}, AFTER=${aCount}`);
}

const required = [
  'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
  'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  '01/QĐ-VKSKV7',
  'QUYẾT ĐỊNH',
  'TRẢ LẠI TÀI SẢN',
  'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
  'Căn cứ Điều 134, Điều 212 Bộ luật Tố tụng hình sự năm 2015',
  'Căn cứ Quyết định truy tố',
  'Căn cứ Quyết định áp dụng biện pháp tạm giam',
  'Căn cứ Kết luận điều tra',
  'Căn cứ Quyết định tạm đình chỉ vụ án',
  'Căn cứ Quyết định tạm đình chỉ đối với bị can',
  'Xét thấy tài sản bị tạm giữ',
  'Điều 1.',
  '01 chiếc xe máy Honda Wave RSX',
  '01 sổ tiết kiệm',
  'Cho ông/bà:',
  '08/9/1985',
  '14/12/2021',
  'Điều 2.',
  'Yêu cầu Phòng Cảnh sát Quản lý hành chính',
  'Lưu: HSVA, HSKS, VP.',
  'Ký thay',
  'VIỆN TRƯỞNG',
];

console.log('\nRequired anchor coverage:');
for (const anchor of required) {
  const bPresent = b.includes(anchor);
  const aPresent = a.includes(anchor);
  if (bPresent !== aPresent) {
    console.log(
      `DIFF '${anchor}': BEFORE=${bPresent}, AFTER=${aPresent}`,
    );
  }
}