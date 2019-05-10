////////////// ADDED BY MO: extens androidhelpers ///////////
import _ from 'lodash';
import { androidHelpers } from 'appium-android-driver';
import { path as unicodeIMEPath } from 'appium-android-ime';

const SETTINGS_HELPER_PKG_ID = 'io.appium.settings';
const UNICODE_IME_PKG_ID = 'io.appium.android.ime';
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

////////////// MODIFIED BY MO: error 137 in MIUI8 ///////////
helpers.initUnicodeKeyboard = async function (adb) {
  logger.debug('Enabling Unicode keyboard support');
  logger.debug("Pushing unicode ime to device...");
  try {
    await adb.install(unicodeIMEPath, {replace: false});
  } catch (err) {
    logger.info(`Performing full reinstall of ${UNICODE_IME_PKG_ID} as a possible fix for: ${err.message}`);
    await adb.uninstallApk(UNICODE_IME_PKG_ID);
    await adb.install(unicodeIMEPath, {replace: false});
  }

  // get the default IME so we can return back to it later if we want
  let defaultIME = await adb.defaultIME();

  logger.debug(`Unsetting previous IME ${defaultIME}`);
  const appiumIME = `${UNICODE_IME_PKG_ID}/.UnicodeIME`;
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

////////////// MODIFIED BY MO: disable logcat options ///////////
helpers.initDevice = async function (adb, opts) {
  await adb.waitForDevice();
  // pushSettingsApp required before calling ensureDeviceLocale for API Level 24+
  await androidHelpers.pushSettingsApp(adb);
  if (!opts.avd) {
    await androidHelpers.setMockLocationApp(adb, SETTINGS_HELPER_PKG_ID);
  }

  await androidHelpers.ensureDeviceLocale(adb, opts.language, opts.locale);
  if (!opts.disableLogcatCapture) {
    await adb.startLogcat();
  }
  let defaultIME;
  if (opts.unicodeKeyboard) {
    defaultIME = await helpers.initUnicodeKeyboard(adb);
  }
  if (_.isUndefined(opts.unlockType)) {
    await androidHelpers.pushUnlock(adb);
  }
  return defaultIME;
};
///////////////////////////////////////////////////////////////
export default helpers;
