// Stage A sentinels - deterministic per-form / per-revision / per-field.
const FORMS = ['001', '136', '148', '156', '157', '168', '171', '174', '181', '206', '213'];

export function sentinelText(formCode, rev, fieldKey) {
  var f = formCode.replace(/^BM-/, '');
  return 'A5_BM' + f + '_' + rev + '_' + fieldKey.replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40) + '_SENT';
}

export function sentinelMultiline(formCode, rev, fieldKey, lines) {
  if (!lines) lines = 2;
  var head = sentinelText(formCode, rev, fieldKey);
  var parts = [head];
  for (var i = 2; i <= lines; i++) parts.push(head + '_L' + i);
  return parts.join('\n');
}

export function sentinelDate(rev) {
  return rev === 'R1' ? '2027-01-09' : '2028-03-15';
}

export function sentinelNumber(rev, idx) {
  return rev === 'R1' ? 4242 + idx : 9001 + idx;
}

export function sentinelBool(rev, idx) {
  if (idx % 2 === 0) return rev === 'R1' ? true : false;
  return rev === 'R1' ? false : true;
}

export function sentinelSelect(rev, idx, options) {
  if (!options) options = ['A', 'B', 'C'];
  var offset = rev === 'R1' ? 0 : 1;
  return options[(idx + offset) % options.length];
}

export function roleSentinels(formCode) {
  var f = formCode.replace(/^BM-/, '');
  return {
    issuer: 'KSV_PHAT_HANH_BM' + f,
    operative: 'KSV_THI_HANH_BM' + f,
    signerTitle: 'Kiểm sát viên sơ cấp BM-' + f,
    signerName: 'Nguyễn Văn Ký_' + f,
    recipient: 'Cơ quan nhận BM-' + f,
    agency: 'Viện KSND BM-' + f,
    footerRole: 'Kiểm sát viên BM-' + f,
  };
}

export var GOLDEN_FORMS = FORMS.map(function (c) { return 'BM-' + c; });
