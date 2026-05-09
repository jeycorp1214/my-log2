// 렌더 에러를 캐치하는 클래스 기반 에러 바운더리
import { Component, type ReactNode } from "react";
import { Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: "#ff6b6b", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
            앱 오류 발생
          </Text>
          <Text style={{ color: "#888", fontSize: 13, textAlign: "center" }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}
