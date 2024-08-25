import { ethers } from "hardhat";

async function main() {
  // Deploy CCIPLocalSimulator
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

  // Router address
  const routerAddress = config.sourceRouter_;
  const adminAddress = "0xAdminAddress"; // Replace with actual admin address if needed

  // Deploy CrossChainNameServiceRegister
  const CrossChainNameServiceRegister = await ethers.getContractFactory("CrossChainNameServiceRegister");
  const ccnsRegister = await CrossChainNameServiceRegister.deploy(routerAddress, adminAddress);
  await ccnsRegister.deployed();
  console.log("CrossChainNameServiceRegister deployed to:", ccnsRegister.address);

  // Deploy CrossChainNameServiceReceiver
  const someOtherAddress = "0xSomeOtherAddress"; // Replace with the actual address
  const CrossChainNameServiceReceiver = await ethers.getContractFactory("CrossChainNameServiceReceiver");
  const ccnsReceiver = await CrossChainNameServiceReceiver.deploy(routerAddress, someOtherAddress);
  await ccnsReceiver.deployed();
  console.log("CrossChainNameServiceReceiver deployed to:", ccnsReceiver.address);

  // Deploy CrossChainNameServiceLookup
  const CrossChainNameServiceLookup = await ethers.getContractFactory("CrossChainNameServiceLookup");
  const ccnsLookup = await CrossChainNameServiceLookup.deploy();
  await ccnsLookup.deployed();
  console.log("CrossChainNameServiceLookup deployed to:", ccnsLookup.address);

  // Enable chain (assuming chainId is a constant or variable you have defined)
  const chainId = 1; // Replace with the correct chain ID
  await ccnsRegister.enableChain(chainId);
  await ccnsReceiver.enableChain(chainId);

  // Set CrossChainNameServiceAddress
  await ccnsLookup.setCrossChainNameServiceAddress("source", ccnsRegister.address);
  await ccnsLookup.setCrossChainNameServiceAddress("receiver", ccnsReceiver.address);

  // Register name
  const aliceAddress = "0xAliceEOAAddress";  // Replace with the actual address
  await ccnsRegister.register("alice.ccns", aliceAddress);

  // Lookup name
  const returnedAddress = await ccnsLookup.lookup("alice.ccns");
  console.log("Returned address for alice.ccns:", returnedAddress);

  // Assert the returned address
  if (returnedAddress === aliceAddress) {
    console.log("Address lookup successful!");
  } else {
    console.error("Address lookup failed!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
