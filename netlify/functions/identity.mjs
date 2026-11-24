import { isOwnerEmail } from "../lib/config.mjs";

export default {
  userValidate(event) {
    return event.deny();
  },
  userLogin(event) {
    if (!isOwnerEmail(event.user.email)) return event.deny();
  },
};
