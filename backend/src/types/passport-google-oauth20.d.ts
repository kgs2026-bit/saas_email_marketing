declare module 'passport-google-oauth20' {
  import { Strategy, Profile } from 'passport';

  interface GoogleProfile extends Profile {
    provider: string;
    _raw: string;
    _json: {
      sub: string;
      email: string;
      email_verified: boolean;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
      locale: string;
      hd: string;
    };
  }

  const GoogleStrategy: Strategy;
  export default GoogleStrategy;
  export = GoogleStrategy;
}
