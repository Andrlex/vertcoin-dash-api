VERTCOIN_DASHBOARD_LOCATION=/var/www/vertcoin-dashboard.com
INSTALL_LOC_DEV=/home/checkout/vertcoin-dash-api/
INSTALL_LOC=/home/vertcoin-dashboard/vertcoin-dash-api/

dev:
	@cd $(INSTALL_LOC_DEV); \
		rsync -qavI * $(VERTCOIN_DASHBOARD_LOCATION)
	@cd $(VERTCOIN_DASHBOARD_LOCATION); \
		npm install; node server.js

live:
	@cd $(INSTALL_LOC); \
		npm install; \
		rsync -qavI $(VERTCOIN_DASHBOARD_LOCATION)
	node server.js live
