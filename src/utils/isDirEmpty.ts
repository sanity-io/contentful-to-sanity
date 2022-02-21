import fse from 'fs-extra'

export async function isDirEmpty(
  dir: string,
  createIfMissing = false,
): Promise<boolean> {
  try {
    const files = await fse.readdir(dir)
    return files.length === 0
  } catch (error) {
    if (
      createIfMissing &&
      error instanceof Error &&
      error.code === 'ENOENT'
    ) {
      await fse.ensureDir(dir)
      return true
    }

    throw error
  }
}
