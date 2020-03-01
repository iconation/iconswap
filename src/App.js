import React, { useState } from 'react'
import { Switch, Route } from 'react-router-dom'
import './App.css';
import Swap from './Swap'
import Header from './Header'
import Homepage from './Homepage'
import AccountOrders from './AccountOrders'
import { WALLET_LOCAL_STORAGE_KEY } from './constants'
import { api } from './API'

function App() {

  const [wallet, setWallet] = useState(localStorage.getItem(WALLET_LOCAL_STORAGE_KEY))

  const loginIconex = () => {
    api.iconexAskAddress().then(address => {
      setWallet(address)
      localStorage.setItem(WALLET_LOCAL_STORAGE_KEY, address)
    })
  }

  return (
    <div className="App">

      {!wallet &&
        <div className="overlay">
          <div className="overlayText">
            <p>You need Google Chrome with ICONex installed for using ICONSwap.</p>
            <button className="bigbutton"
              onClick={() => loginIconex()}>
              Login with ICONex
          </button>
          </div>
        </div>
      }

      {wallet && <>

        <Header wallet={wallet} setWallet={setWallet} />

        <div id="body">
          <Switch>
            <Route exact path='/' render={(props) => <Homepage {...props} wallet={wallet} />} />
            <Route exact path='/swap/:id' render={(props) => <Swap {...props} wallet={wallet} />} />
            <Route exact path='/account/orders' render={(props) => <AccountOrders {...props} wallet={wallet} />} />
          </Switch>
        </div>
      </>}

    </div>
  );
}

export default App;
