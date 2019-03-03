import React, { Component } from "react";
import { Provider } from "mobx-react";
import NameInput from "./name-input";

class App extends Component {
  state = {
    count: 0
  };

  onClick = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    const { gameStore } = this.props;

    return (
      <Provider gameStore={gameStore}>
        <div>
          <p>
            I'm a React HUD. You've clicked {this.state.count} times!{" "}
            <button onClick={this.onClick}>Click</button>
          </p>
          <NameInput />
        </div>
      </Provider>
    );
  }
}

export default App;
