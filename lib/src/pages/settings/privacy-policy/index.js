"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PrivacyPolicyPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
require("../user-agreement/index.scss"); // Re-use the same SCSS as UserAgreement
function PrivacyPolicyPage() {
    // TODO: Replace this with your actual Privacy Policy content
    const policyTitle = "帮帮隐私政策";
    const policyContent = `
欢迎来到帮帮！我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。

本隐私政策将帮助您了解以下内容：
1. 我们如何收集和使用您的个人信息
   在您使用我们的产品和/或服务时，我们可能需要收集和使用的您的个人信息包括如下两种...

2. 我们如何使用 Cookie 和同类技术
   为确保网站正常运转，我们会在您的计算机或移动设备上存储名为 Cookie 的小数据文件...

3. 我们如何共享、转让、公开披露您的个人信息
   我们不会与帮帮服务提供者以外的公司、组织和个人共享您的个人信息，但以下情况除外...

4. 我们如何保护您的个人信息
   我们已使用符合业界标准的安全防护措施保护您提供的个人信息...

5. 您的权利
   按照中国相关的法律、法规、标准，以及其他国家、地区的通行做法，我们保障您对自己的个人信息行使以下权利...

6. 本隐私政策如何更新
   我们的隐私政策可能变更。未经您明确同意，我们不会削减您按照本隐私政策所应享有的权利...

更新日期：2024年05月28日
生效日期：2024年05月28日
`;
    return ((0, jsx_runtime_1.jsxs)(components_1.ScrollView, { scrollY: true, className: "policy-page", children: [" ", (0, jsx_runtime_1.jsxs)(components_1.View, { className: "policy-content", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "policy-title", children: policyTitle }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "policy-text", children: policyContent })] })] }));
}
// Optional: Page configuration
definePageConfig({
    navigationBarTitleText: "隐私政策",
});
//# sourceMappingURL=index.js.map