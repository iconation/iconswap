import React, { useState } from 'react'
import { Switch, Route } from 'react-router-dom'
import './App.css';
import Swap from './Swap'
import Homepage from './Homepage'
import { api } from './API'


function App() {

  const [wallet, setWallet] = useState('hxba2e54b54b695085f31ff1a9b33868b5aea44e33')

  const loginIconex = () => {
    api.iconexAskAddress().then(address => {
      setWallet(address)
    })
  }

  return (
    <div className="App">

      {!wallet &&
        <button className="bigbutton center"
          onClick={() => loginIconex()}>
          Login with ICONex
          </button>
      }

      {wallet &&
        <Switch>
          <Route exact path='/' render={(props) => <Homepage {...props} wallet={wallet} />} />
          <Route exact path='/swap/:id' render={(props) => <Swap {...props} wallet={wallet} />} />
        </Switch>
      }

    </div>
  );
}

export default App;
