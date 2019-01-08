import * as os from "os";

export type ErrnoCode = keyof typeof os.constants.errno;