import React, { useState } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import './App.css';
import Swap from './Swap'
import Header from './Header'
import Footer from './Footer'
import Homepage from './Homepage'
import AccountOrders from './AccountOrders'
import MarketChoser from './MarketChoser'
import MarketPair from './MarketPair'
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
            <Route exact path='/market' render={(props) => <MarketChoser {...props} wallet={wallet} />} />
            <Route exact path='/market/:pair1/:pair2' render={(props) => <MarketPair {...props} wallet={wallet} />} />
            <Route render={() => <Redirect to="/" />} />
          </Switch>
        </div>
      </>}

      <Footer />

    </div>
  );
}

export default App;
