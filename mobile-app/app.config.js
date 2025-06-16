export default {
  expo: {
    name: "LOADMworkflow",
    slug: "loadmworkflow-training",
    version: "1.0.0",
    orientation: "landscape",
    userInterfaceStyle: "dark",
    platforms: ["ios"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.loadmworkflow.training",
      buildNumber: "1",
      requireFullScreen: true,
      supportedInterfaceOrientations: ["landscapeLeft", "landscapeRight"],
      usesAppleSignIn: false,
      config: {
        usesNonExemptEncryption: false
      }
    },
    description: "Military logistics training platform for comprehensive aircraft load planning and operational readiness simulation.",
    owner: "markust"
  }
};