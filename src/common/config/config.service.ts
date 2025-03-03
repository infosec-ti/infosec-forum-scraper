export const Env = {
  FORUM_USERNAME: "FORUM_USERNAME",
  FORUM_PASSWORD: "FORUM_PASSWORD",
  FORUM_URL: "FORUM_URL",
} as const;

export type Env = (typeof Env)[keyof typeof Env];

export class ConfigService {
  getVar(env: Env) {
    const environment = process.env[env];
    if (!environment) {
      throw new Error(`Environment variable ${env} is not defined`);
    }

    return environment;
  }
}
