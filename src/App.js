import React, { useState } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import './App.css';
import Swap from './Swap'
import Header from './Header'
import Footer from './Footer'
import Homepage from './Homepage'
import AccountOrders from './AccountOrders'
import ListSwap from './ListSwap'
import ListSwap2 from './ListSwap2'
import { WALLET_LOCAL_STORAGE_KEY } from './constants'
import LoginScreen from './LoginScreen';

function App() {

  const [wallet, setWallet] = useState(localStorage.getItem(WALLET_LOCAL_STORAGE_KEY))

  return (
    <div className="App">

      <Header wallet={wallet} setWallet={setWallet} />

      {!wallet && <LoginScreen setWallet={setWallet} />}

      {wallet && <>
        <div id="body">
          <Switch>
            <Route exact path='/' render={(props) => <Homepage {...props} wallet={wallet} />} />
            <Route exact path='/swap/:id' render={(props) => <Swap {...props} wallet={wallet} />} />
            <Route exact path='/account/orders' render={(props) => <AccountOrders {...props} wallet={wallet} />} />
            <Route exact path='/list' render={(props) => <ListSwap {...props} wallet={wallet} />} />
            <Route exact path='/list2' render={(props) => <ListSwap2 {...props} wallet={wallet} />} />
            <Route render={() => <Redirect to="/" />} />
          </Switch>
        </div>
      </>}

      <Footer />

    </div>
  );
}

export default App;
