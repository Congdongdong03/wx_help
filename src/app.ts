import { PropsWithChildren } from "react";
import { useLaunch } from "@tarojs/taro";
import Taro from "@tarojs/taro";

// import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log("App launched.");
    // 全局请求拦截器，强制加 x-openid
    Taro.addInterceptor((chain) => {
      const requestParams = chain.requestParams;
      requestParams.header = {
        ...(requestParams.header || {}),
        "x-openid": "dev_openid_123",
      };
      return chain.proceed(requestParams);
    });
  });

  // children 是将要会渲染的页面
  return children;
}

export default App;
