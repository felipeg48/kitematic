jest.dontMock('../src/SetupStore');
var setupStore = require('../src/SetupStore');
var virtualBox = require('../src/VirtualBox');
var util = require('../src/Util');
var boot2docker = require('../src/Boot2Docker');
var setupUtil = require('../src/SetupUtil');
var Promise = require('bluebird');

describe('SetupStore', function () {
  describe('download step', function () {
    util.packagejson.mockReturnValue({});
    pit('downloads virtualbox if it is not installed', function () {
      virtualBox.installed.mockReturnValue(false);
      setupUtil.download.mockReturnValue(Promise.resolve());
      return setupStore.steps().download.run().then(() => {
        expect(setupUtil.download).toBeCalled();
      });
    });

    pit('downloads virtualbox if it is installed but has an outdated version', function () {
      virtualBox.installed.mockReturnValue(true);
      virtualBox.version.mockReturnValue(Promise.resolve('4.3.16'));
      setupUtil.compareVersions.mockReturnValue(-1);
      setupUtil.download.mockReturnValue(Promise.resolve());
      return setupStore.steps().download.run().then(() => {
        expect(setupUtil.download).toBeCalled();
      });
    });
  });

  describe('install step', function () {
    util.exec.mockReturnValue(Promise.resolve());
    util.copyBinariesCmd.mockReturnValue('copycmd');
    util.fixBinariesCmd.mockReturnValue('fixcmd');
    virtualBox.killall.mockReturnValue(Promise.resolve());
    setupUtil.installVirtualBoxCmd.mockReturnValue('installvb');
    setupUtil.macSudoCmd.mockImplementation(cmd => 'macsudo ' + cmd);

    pit('installs virtualbox if it is not installed', function () {
      virtualBox.installed.mockReturnValue(false);
      util.exec.mockReturnValue(Promise.resolve());
      return setupStore.steps().install.run().then(() => {
        expect(virtualBox.killall).toBeCalled();
        expect(util.exec).toBeCalledWith('macsudo copycmd && fixcmd && installvbcmd');
      });
    });

    pit('installs virtualbox if it is installed but has an outdated version', function () {
      virtualBox.installed.mockReturnValue(true);
      virtualBox.version.mockReturnValue(Promise.resolve('4.3.16'));
      setupUtil.compareVersions.mockReturnValue(-1);
      util.exec.mockReturnValue(Promise.resolve());
      return setupStore.steps().install.run().then(() => {
        expect(virtualBox.killall).toBeCalled();
        expect(util.exec).toBeCalledWith('macsudo copycmd && fixcmd && installvbcmd');
      });
    });

    pit('only installs binaries if virtualbox is installed', function () {
      virtualBox.installed.mockReturnValue(true);
      setupUtil.compareVersions.mockReturnValue(0);
      setupUtil.needsBinaryFix.mockReturnValue(true);
      return setupStore.steps().install.run().then(() => {
        expect(util.exec).toBeCalledWith('macsudo copycmd && fixcmd');
      });
    });
  });

  describe('init step', function () {
    virtualBox.vmdestroy.mockReturnValue(Promise.resolve());
    pit('inintializes the boot2docker vm if it does not exist', function () {
      boot2docker.exists.mockReturnValue(Promise.resolve(false));
      boot2docker.init.mockReturnValue(Promise.resolve());
      return setupStore.steps().init.run().then(() => {
        expect(boot2docker.init).toBeCalled();
      });
    });

    pit('upgrades the boot2docker vm if it exists and is out of date', function () {
      boot2docker.exists.mockReturnValue(Promise.resolve(true));
      boot2docker.isoversion.mockReturnValue('1.0');
      boot2docker.haskeys.mockReturnValue(true);
      boot2docker.stop.mockReturnValue(Promise.resolve());
      boot2docker.upgrade.mockReturnValue(Promise.resolve());
      setupUtil.compareVersions.mockReturnValue(-1);
      return setupStore.steps().init.run().then(() => {
        boot2docker.init.mockClear();
        expect(boot2docker.init).not.toBeCalled();
        expect(boot2docker.upgrade).toBeCalled();
      });
    });
  });

  describe('start step', function () {
    pit('starts the boot2docker vm if it is not running', function () {
      boot2docker.status.mockReturnValue(false);
      boot2docker.waitstatus.mockReturnValue(Promise.resolve());
      boot2docker.start.mockReturnValue(Promise.resolve());
      return setupStore.steps().start.run().then(() => {
        expect(boot2docker.start).toBeCalled();
      });
    });
  });
});
