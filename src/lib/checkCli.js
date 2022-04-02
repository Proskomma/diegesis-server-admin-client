import path from "path";
import fse from "fs-extra";

// CLI error helper function
const croak = msg => {
    const usageMessage = `%msg%\nUSAGE: node src/index.js [configFilePath]`
    console.log(usageMessage.replace('%msg%', msg));
    process.exit(1);
}
export default function checkCli() {
// Check CLI invocation
    if (process.argv.length < 2 || process.argv.length > 3) {
        croak('ERROR: Wrong number of arguments');
    }

// Get config file if provided
    if (process.argv.length === 3) {
        const absPath = path.resolve(process.argv[2]);
        if (!fse.pathExistsSync(absPath)) {
            croak(`ERROR: Config file path '${absPath}' does not exist`);
        }
        let providedConfig;
        try {
            providedConfig = fse.readJsonSync(absPath);
        } catch (err) {
            croak(`ERROR: Could not read and parse JSON file '${absPath}'`);
        }
        return providedConfig;
    }
    return {};
}
