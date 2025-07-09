import { Component } from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import "./index.scss";

interface Props {
  children: any;
  fallback?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="error-boundary">
          <Text className="error-title">出错了</Text>
          <Text className="error-message">
            {this.state.error?.message || "发生了一些错误"}
          </Text>
          <View
            className="error-retry"
            onClick={() => this.setState({ hasError: false, error: null })}
            role="button"
            tabIndex={0}
            aria-label="重试"
          >
            重试
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
