import jp from "./jupyter-paths";
import path from "path";
import fs from "fs";

type KernelInfo = {
  name: string;
  resourceDir: string;
};

type KernelResources = {
  name: string;
  files: string[];
  resources_dir: string;
  spec: any;
};

/**
 * Converts a callback style call to a Promise
 * @param  {function} f       a node style function that accepts a callback
 * @param  {Object[]} args    arguments to pass to the function when invoking it
 * @return {Promise<Object>}  object returned by the function
 */
function promisify(f, args) {
  return new Promise((resolve, reject) =>
    f.apply(this, args.concat((err, x) => (err ? reject(err) : resolve(x))))
  );
}

/**
 * Get a kernel resources object
 * @param  {Object}   kernelInfo              description of a kernel
 * @param  {string}   kernelInfo.name         name of the kernel
 * @param  {string}   kernelInfo.resourceDir  kernel's resources directory
 * @return {Promise<Object>}                  Promise for a kernelResources object
 */
function getKernelResources(kernelInfo: KernelInfo): Promise<KernelResources> {
  return promisify(fs.readdir, [kernelInfo.resourceDir]).then(
    (files: string[]) => {
      const kernelJSONIndex = files.indexOf("kernel.json");
      if (kernelJSONIndex === -1) {
        throw new Error("kernel.json not found");
      }

      return promisify(fs.readFile, [
        path.join(kernelInfo.resourceDir, "kernel.json")
      ]).then((data: string) => ({
        name: kernelInfo.name,
        files: files.map(x => path.join(kernelInfo.resourceDir, x)),
        resources_dir: kernelInfo.resourceDir, // eslint-disable-line camelcase
        spec: JSON.parse(data)
      }));
    }
  );
}

/**
 * Gets a list of kernelInfo objects for a given directory of kernels
 * @param  {string}   directory path to a directory full of kernels
 * @return {Promise<Object[]>}  Promise for an array of kernelInfo objects
 */
function getKernelInfos(directory) {
  return promisify(fs.readdir, [directory]).then((files: string[]) =>
    files.map(fileName => ({
      name: fileName,
      resourceDir: path.join(directory, fileName)
    }))
  );
}

/**
 * find a kernel by name
 * @param  {string} kernelName the kernel to locate
 * @return {Object} kernelResource object
 */
function find(kernelName) {
  return jp
    .dataDirs({ withSysPrefix: true })
    .then(dirs => {
      const kernelInfos = dirs.map(dir => ({
        name: kernelName,
        resourceDir: path.join(dir, "kernels", kernelName)
      }));

      return extractKernelResources(kernelInfos);
    })
    .then(kernelResource => kernelResource[kernelName]);
}

function extractKernelResources(kernelInfos: KernelInfo[]) {
  return Promise.all(
    kernelInfos
      .filter(a => a) // remove null/undefined kernelInfo
      .reduce((a, b) => a.concat(b), []) // flatten the results into one array
      .map(a => getKernelResources(a).catch(() => {})) // convert kernelInfo -> kernelResources and ignore errors
  ).then((kernelResources: KernelResources[]) =>
    kernelResources
      .filter(a => a) // remove null/undefined kernelResources
      .reduce((kernels, kernel) => {
        if (!kernels[kernel.name]) {
          kernels[kernel.name] = kernel;
        }
        return kernels;
      }, {})
  );
}

/**
 * Get an array of kernelResources objects for the host environment
 * This matches the Jupyter notebook API for kernelspecs exactly
 * @return {Promise<Object<string,kernelResource>} Promise for an array of kernelResources objects
 */
function findAll() {
  return jp.dataDirs({ withSysPrefix: true }).then(dirs => {
    return Promise.all(
      dirs
        // get kernel infos for each directory and ignore errors
        .map(dir => getKernelInfos(path.join(dir, "kernels")).catch(() => {}))
    ).then(extractKernelResources);
  });
}

export default { find, findAll, getKernelInfos, getKernelResources };
