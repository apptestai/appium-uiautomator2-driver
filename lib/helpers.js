import path from 'path';
import { fs, system } from 'appium-support';

////////////// ADDED BY MO: extens androidhelpers ///////////
import _ from 'lodash';
import { androidHelpers } from 'appium-android-driver';
import logger from './logger';

const SETTINGS_HELPER_PKG_ID = 'io.appium.settings';
///////////////////////////////////////////////////////////////

let helpers = {};

helpers.ensureInternetPermissionForApp = async function (adb, app) {
  let has = await adb.hasInternetPermissionFromManifest(app);
  if (has) {
    return;
  }
  let msg = 'Your apk does not have INTERNET permissions. Uiautomator2 needs ' +
            'the internet permission to proceed. Please check if you have ' +
            '<uses-permission android:name="android.**permission.INTERNET"/>' +
            'in your AndroidManifest.xml';
  throw new Error(msg);
};

helpers.isWriteable = async function isWriteable (filePath) {
  try {
    await fs.access(filePath, fs.W_OK);
    if (system.isWindows()) {
      // On operating systems, where access-control policies may
      // limit access to the file system, `fs.access` does not work
      // as expected. See https://groups.google.com/forum/#!topic/nodejs/qmZtIwDRSYo
      // for more details
      await fs.close(await fs.open(filePath, 'r+'));
    }
    return true;
  } catch (ign) {
    return false;
  }
};

helpers.signApp = async function (adb, appPath) {
  if (!await this.isWriteable(appPath)) {
    throw new Error(`The application at '${appPath}' is not writeable. ` +
      `Please grant write permissions to this file or to its parent folder '${path.dirname(appPath)}' ` +
      `for the Appium process, so it could sign the application`);
  }
  await adb.sign(appPath);
};

////////////// MODIFIED BY MO: error 137 in MIUI8 ///////////
androidHelpers.initUnicodeKeyboard = async function initUnicodeKeyboard (adb) {
  logger.debug('Enabling Unicode keyboard support(override)');

  // get the default IME so we can return back to it later if we want
  let defaultIME = await adb.defaultIME();

  logger.debug(`Unsetting previous IME ${defaultIME}`);
  const appiumIME = `${SETTINGS_HELPER_PKG_ID}/.UnicodeIME`;
  logger.debug(`Setting IME to '${appiumIME}'`);
  try {
    await adb.enableIME(appiumIME);
  } catch (ign) {
    logger.warn(`Unable to enable IME: ${ign.message}`);
  }

  try {
    await adb.setIME(appiumIME);
  } catch (ign) {
    logger.warn(`Unable to set IME: ${ign.message}`);
  }
  return defaultIME;
};
///////////////////////////////////////////////////////////////

export default helpers;
