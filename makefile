prepare:
	echo $(date)
	npm run build
	rm -rf ./deploy && mkdir deploy
	cd ./deploy && mkdir woow
	cd ./../../
	cd ./target && cp ./woow.contract.wasm ./../deploy/woow/woow.contract.wasm && cp ./woow.contract.abi ./../deploy/woow/woow.contract.abi

prepare-min:
	echo $(date)
	npm run min
	rm -rf ./deploy && mkdir deploy
	cd ./deploy && mkdir woow_min
	cd ./../../
	cd ./target && cp ./woow.contract.min.wasm ./../deploy/woow_min/woow.contract.min.wasm && cp ./woow.contract.min.abi ./../deploy/woow_min/woow.contract.min.abi

deploy-testnet:

	cd ./deploy/woow && proton chain:set proton-test && proton contract:set wookey ./ 

deploy-min:

	cd ./deploy/woow_min && proton chain:set proton-test && proton contract:set wookey ./ 

deploy-mainnet:
	cd ./deploy/woow && proton chain:set proton && proton contract:set wookey ./ 

feed-ram:
	proton chain:set proton-test && proton faucet:claim XPR wookey || echo "already claimed" && proton ram:buy wookey wookey 450000

min:
	make prepare-min && make deploy-min

testnet:
	make prepare && make deploy-testnet

publish:
	make prepare && make deploy-mainnet