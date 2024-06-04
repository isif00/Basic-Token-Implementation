import React from "react";
import { ethers } from "ethers";
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";

const HARDHAT_NETWORK_ID = '31337';
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

interface DappState {
  tokenData?: {
    name: string;
    symbol: string;
  };

  selectedAddress?: string;
  balance?: ethers.BigNumberish;
  txBeingSent?: string;
  transactionError?: Error;
  networkError?: string;
}

export class Dapp extends React.Component<Record<string, never>, DappState> {
  private _provider?: ethers.Provider;
  private _token?: ethers.Contract;
  private _pollDataInterval?: NodeJS.Timeout;

  constructor(props: Record<string, never>) {
    super(props);
    this.state = this.initialState;
  }

  get initialState(): DappState {
    return {
      tokenData: undefined,
      selectedAddress: undefined,
      balance: undefined,
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };
  }

  render() {
    if (window.ethereum === undefined) {
      // return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      // return (
      //   <ConnectWallet 
      //     connectWallet={() => this._connectWallet()} 
      //     networkError={this.state.networkError}
      //     dismiss={() => this._dismissNetworkError()}
      //   />
      // );
    }

    if (!this.state.tokenData || !this.state.balance) {
      // return <Loading />;
    }

    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              {/* {this.state.tokenData.name} ({this.state.tokenData.symbol}) */}
            </h1>
            <p>
              Welcome <b>{this.state.selectedAddress}</b>, you have{" "}
              <b>
                {/* {this.state.balance.toString()} {this.state.tokenData.symbol} */}
              </b>
              .
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {/* {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )} */}
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {/* {this.state.balance.eq(0) && (
              <NoTokensMessage selectedAddress={this.state.selectedAddress} />
            )}
            {this.state.balance.gt(0) && (
              <Transfer
                transferTokens={(to: string, amount: ethers.BigNumberish) =>
                  this._transferTokens(to, amount)
                }
                tokenSymbol={this.state.tokenData.symbol}
              />
            )} */}
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    this._checkNetwork();
    this._initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]: string[]) => {
      this._stopPollingData();
      if (newAddress === undefined) {
        return this._resetState();
      }
      this._initialize(newAddress);
    });
  }

  _initialize(userAddress: string) {
    this.setState({ selectedAddress: userAddress });

    this._initializeEthers();
    this._getTokenData();
    this._startPollingData();
  }

  async _initializeEthers() {
    this._provider = new ethers.BrowserProvider(window.ethereum)
    this._token = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
    );
  }

  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);
    this._updateBalance();
  }

  _stopPollingData() {
    if (this._pollDataInterval) {
      clearInterval(this._pollDataInterval);
      this._pollDataInterval = undefined;
    }
  }

  async _getTokenData() {
    if (!this._token) return;
    const name = await this._token.name();
    const symbol = await this._token.symbol();
    this.setState({ tokenData: { name, symbol } });
  }

  async _updateBalance() {
    if (!this._token || !this.state.selectedAddress) return;
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  async _transferTokens(to: string, amount: ethers.BigNumberish) {
    try {
      this._dismissTransactionError();
      if (!this._token) return;
      const tx = await this._token.transfer(to, amount);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this._updateBalance();
    } catch (error: any) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  _getRpcErrorMessage(error: any): string {
    if (error.data) {
      return error.data.message;
    }
    return error.message;
  }

  _resetState() {
    this.setState(this.initialState);
  }

  async _switchChain() {
    const chainIdHex = `0x${HARDHAT_NETWORK_ID.toString()}`;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await this._initialize(this.state.selectedAddress!);
  }

  _checkNetwork() {
    if (window.ethereum !== HARDHAT_NETWORK_ID) {
      this._switchChain();
    }
  }
}
