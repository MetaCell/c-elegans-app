import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  onError: (error: Error) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error) {
    const { onError } = this.props;
    this.setState({ hasError: true, errorMessage: error.message });
    onError(error);
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    return (
      <>
        {children}
        {hasError && null}
      </>
    );
  }
}

export default ErrorBoundary;
