import Taro from "@tarojs/taro";
import { View, Text, ScrollView } from "@tarojs/components";
import "./index.scss";

export default function UserAgreementPage() {
  const agreementTitle = "帮帮用户协议";
  const agreementContent = `
欢迎使用帮帮！

请您务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款、法律适用和争议解决条款。

1. 服务说明
   帮帮提供一个信息发布与交流的平台... (此处省略10000字)

2. 用户行为规范
   您在使用本服务时须遵守法律法规，不得利用本服务从事违法违规行为...

3. 知识产权
   帮帮平台的内容（包括但不限于文字、图片、代码等）的知识产权归帮帮所有...

4. 免责声明
   您理解并同意，在使用本服务的过程中，可能会遇到不可抗力等风险因素...

5. 协议的修改
   我们有权随时修改本协议的任何条款，一旦本协议的内容发生变动，我们将会通过适当方式向用户提示修改内容...

6. 法律管辖和适用
   本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律...

更新日期：2024年05月28日
生效日期：2024年05月28日
`;

  return (
    <ScrollView scrollY className="policy-page">
      <View className="policy-content">
        <Text className="policy-title">{agreementTitle}</Text>
        <Text className="policy-text">{agreementContent}</Text>
      </View>
    </ScrollView>
  );
}

definePageConfig({
  navigationBarTitleText: "用户协议",
});
