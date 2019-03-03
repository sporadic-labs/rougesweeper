import React, { Component } from "react";
import { observer, inject } from "mobx-react";

class NameInput extends Component {
  onChange = e => {
    const { gameStore } = this.props;
    gameStore.setPlayerName(e.target.value);
  };

  render() {
    const { gameStore } = this.props;

    return (
      <div>
        <label htmlFor="name">Player Name:</label>
        <input type="text" name="name" id="name" value={gameStore.name} onChange={this.onChange} />
      </div>
    );
  }
}

export default inject("gameStore")(observer(NameInput));
