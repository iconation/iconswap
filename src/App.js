import { useLocation } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import './App.css';
import Swap from './Swap'
import Header from './Header'
import Footer from './Footer'
import Homepage from './Homepage'
import AccountOrders from './AccountOrders'
import MarketChoser from './MarketChoser'
import MarketPair from './MarketPair'
import MaintenanceScreen from './MaintenanceScreen'
import Admin from './Admin'
import { WALLET_LOCAL_STORAGE_KEY } from './constants'
import LoginScreen from './LoginScreen';
import { api } from './API'

function App() {

  // const [wallet, setWallet] = useState(localStorage.getItem(WALLET_LOCAL_STORAGE_KEY))
  const [wallet, setWallet] = useState("hx8d3d046b8adc47bb5d0a5b5ae3d02a4e2204e04c")
  const [maintenance, setMaintenance] = useState(false)

  useEffect(() => {
    api.isMaintenanceEnabled().then(status => {
      setMaintenance(status)
    }).catch(error => {
      console.log(error)
      setMaintenance(false)
    })
  }, [maintenance, setMaintenance]);

  const location = useLocation();

  return (
    <div className="App">

      <Header wallet={wallet} setWallet={setWallet} />

      {!wallet && <LoginScreen setWallet={setWallet} />}

      {wallet && <>
        <div id="body">
          <Switch>
            {!maintenance && <Route exact path='/' render={(props) => <Homepage {...props} wallet={wallet} />} />}
            {!maintenance && <Route exact path='/swap/:id' render={(props) => <Swap {...props} wallet={wallet} />} />}
            {!maintenance && <Route exact path='/account/orders' render={(props) => <AccountOrders {...props} wallet={wallet} />} />}
            {!maintenance && <Route exact path='/market' render={(props) => <MarketChoser {...props} wallet={wallet} />} />}
            {!maintenance && <Route exact path='/market/:pair1/:pair2' render={(props) => <MarketPair {...props} wallet={wallet} />} />}
            <Route exact path='/score_admin' render={(props) => <Admin {...props} wallet={wallet} />} />
            <Route render={() => <Redirect to="/" />} />
          </Switch>
          {(wallet !== null && maintenance && location.pathname.includes('/score_admin') !== true) &&
            <MaintenanceScreen />
          }
        </div>
      </>}

      <Footer />

    </div>
  );
}

export default App;
