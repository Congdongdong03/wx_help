import React, { Component } from "react";
import { Provider } from "react-redux";
import store from "./store";
import "@nutui/nutui-react-taro/dist/style.css"; // 或者 '@nutui/nutui-react-taro/dist/style/index.scss'
interface AppProps extends React.PropsWithChildren<{}> {}

class App extends Component<AppProps> {
  componentDidMount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return <Provider store={store}>{this.props.children}</Provider>;
  }
}

export default App;
