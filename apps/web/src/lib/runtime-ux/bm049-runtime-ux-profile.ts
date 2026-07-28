import { type RuntimeUxProfile, registerRuntimeUxProfile } from "./runtime-ux-profile";
const BM049_RUNTIME_UX_PROFILE: RuntimeUxProfile = {
  templateCode: "BM-049", versionLabel: "BM-049 curated money-guarantee approval profile",
  sections: [{ sectionId: "section-thong-tin-bieu-mau", title: "Cơ quan phê chuẩn đặt tiền để bảo đảm", description: "Viện kiểm sát ban hành và cơ quan/người đã ra quyết định đề nghị phê chuẩn biện pháp đặt tiền để bảo đảm." }],
  fields: { "agency.tenVien": { label: "Viện kiểm sát ban hành quyết định phê chuẩn" }, "agency.coQuan": { label: "Cơ quan/người ra quyết định đặt tiền để bảo đảm" } },
  demo: { "agency.tenVien": "Viện kiểm sát nhân dân Khu vực 7", "agency.coQuan": "Cơ quan Cảnh sát điều tra Công an thành phố Hà Nội" },
};
registerRuntimeUxProfile(BM049_RUNTIME_UX_PROFILE);
