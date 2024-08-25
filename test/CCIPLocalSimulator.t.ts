
import { ethers } from "hardhat";
import { expect } from "chai";

describe("CrossChainNameService", function () {
  const GAS_LIMIT = 500000; // Five hundred thousand gas limit
  let adminAddress: string;
  let someOtherAddress: string;
  let aliceAddress: string;
  let ccnsLookup: any;

  before(async function () {
    // Fetch test accounts
    const accounts = await ethers.getSigners();
    adminAddress = accounts[0].address;
    someOtherAddress = accounts[1].address;
    aliceAddress = accounts[2].address;
  });

  async function deploy() {
    const localSimulatorFactory = await ethers.getContractFactory("CCIPLocalSimulator");
    const localSimulator = await localSimulatorFactory.deploy();
    await localSimulator.deployed();

    const config: {
        chainSelector_: bigint;
        sourceRouter_: string;
        destinationRouter_: string;
        wrappedNative_: string;
        linkToken_: string;
        ccipBnM_: string;
        ccipLnM_: string;
    } = await localSimulator.configuration();
    console.log("Configuration:", config);

    const routerAddress = config.sourceRouter_;

    // Deploy CrossChainNameServiceRegister
    const CrossChainNameServiceRegister = await ethers.getContractFactory("CrossChainNameServiceRegister");
    const ccnsRegister = await CrossChainNameServiceRegister.deploy(routerAddress, adminAddress, someAdditionalAddress); // Pass all required arguments
    await ccnsRegister.deployed();
    console.log("CrossChainNameServiceRegister deployed to:", ccnsRegister.address);

    // Deploy CrossChainNameServiceReceiver
    const CrossChainNameServiceReceiver = await ethers.getContractFactory("CrossChainNameServiceReceiver");
    const ccnsReceiver = await CrossChainNameServiceReceiver.deploy(routerAddress, someOtherAddress);
    await ccnsReceiver.deployed();
    console.log("CrossChainNameServiceReceiver deployed to:", ccnsReceiver.address);

    // Deploy CrossChainNameServiceLookup
    const CrossChainNameServiceLookup = await ethers.getContractFactory("CrossChainNameServiceLookup");
    ccnsLookup = await CrossChainNameServiceLookup.deploy();
    await ccnsLookup.deployed();
    console.log("CrossChainNameServiceLookup deployed to:", ccnsLookup.address);

    // Enable chain
    const chainId = 1; // Replace with the correct chain ID if needed
    await ccnsRegister.enableChain(chainId);
    await ccnsReceiver.enableChain(chainId);

    // Set CrossChainNameServiceAddress
    await ccnsLookup.setCrossChainNameServiceAddress("source", ccnsRegister.address);
    await ccnsLookup.setCrossChainNameServiceAddress("receiver", ccnsReceiver.address);

    // Register name
    await ccnsRegister.register("alice.ccns", aliceAddress);

    return { ccnsLookup, aliceAddress };
  }

  it("should return the correct address for alice.ccns", async function () {
    const { ccnsLookup, aliceAddress } = await deploy(); // Directly call deploy function

    const returnedAddress = await ccnsLookup.lookup("alice.ccns");
    console.log("Returned address for alice.ccns:", returnedAddress);

    expect(returnedAddress).to.equal(aliceAddress);
  });
});
