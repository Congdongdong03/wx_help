import React, { Component } from "react";
import { Provider } from "react-redux";
import store from "./store";
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
