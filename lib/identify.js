"use strict";

import { Facade } from "./facade";
import get from "@head.js/analytics.js-obj-case";
import inherit from "inherits";
import isEmail from "./is-email";
import newDate from "new-date";

let trim = (str) => str.trim();

/**
 * Initialize a new `Identify` facade with a `dictionary` of arguments.
 *
 * @param {Object} dictionary - The object to wrap.
 * @param {string} [dictionary.userId] - The ID of the user.
 * @param {string} [dictionary.anonymousId] - The anonymous ID of the user.
 * @param {string} [dictionary.traits] - The user's traits.
 * @param {Object} opts - Options about what kind of Facade to create.
 *
 * @augments Facade
 */
export function Identify(dictionary, opts) {
  Facade.call(this, dictionary, opts);
}

inherit(Identify, Facade);

const i = Identify.prototype;

/**
 * Return the type of facade this is. This will always return `"identify"`.
 *
 * @return {string}
 */
i.action = function () {
  return "identify";
};

/**
 * An alias for {@link Identify#action}.
 *
 * @function
 * @return {string}
 */
i.type = i.action;

/**
 * Get the user's traits. This is identical to how {@link Facade#traits} works,
 * except it looks at `traits.*` instead of `options.traits.*`.
 *
 * Traits are gotten from `traits`, augmented with a property `id` with
 * the event's `userId`.
 *
 * The parameter `aliases` is meant to transform keys in `traits` into new
 * keys. Each alias like `{ "xxx": "yyy" }` will take whatever is at `xxx` in
 * the traits, and move it to `yyy`. If `xxx` is a method of this facade, it'll
 * be called as a function instead of treated as a key into the traits.
 *
 * @example
 * let obj = { traits: { foo: "bar" }, anonymousId: "xxx" }
 * let identify = new Identify(obj)
 *
 * identify.traits() // { "foo": "bar" }
 * identify.traits({ "foo": "asdf" }) // { "asdf": "bar" }
 * identify.traits({ "sessionId": "rofl" }) // { "rofl": "xxx" }
 *
 * @param {Object} aliases - A mapping from keys to the new keys they should be
 * transformed to.
 * @return {Object}
 */
i.traits = function (aliases) {
  let ret = this.field("traits") || {};
  let id = this.userId();
  aliases = aliases || {};

  if (id) ret.id = id;

  for (let alias in aliases) {
    let value =
      this[alias] == null ? this.proxy("traits." + alias) : this[alias]();
    if (value == null) continue;
    ret[aliases[alias]] = value;
    if (alias !== aliases[alias]) delete ret[alias];
  }

  return ret;
};

/**
 * Get the user's email from `traits.email`, falling back to `userId` only if
 * it looks like a valid email.
 *
 * This *should* be a string, but may not be if the client isn't adhering to
 * the spec.
 *
 * @return {string}
 */
i.email = function () {
  let email = this.proxy("traits.email");
  if (email) return email;

  let userId = this.userId();
  if (isEmail(userId)) return userId;
};

/**
 * Get the time of creation of the user from `traits.created` or
 * `traits.createdAt`.
 *
 * @return {Date}
 */
i.created = function () {
  let created = this.proxy("traits.created") || this.proxy("traits.createdAt");
  if (created) return newDate(created);
};

/**
 * Get the user's name `traits.name`, falling back to combining {@link
 * Identify#firstName} and {@link Identify#lastName} if possible.
 *
 * This *should* be a string, but may not be if the client isn't adhering to
 * the spec.
 *
 * @return {string}
 */
i.name = function () {
  let name = this.proxy("traits.name");
  if (typeof name === "string") {
    return trim(name);
  }

  let firstName = this.firstName();
  let lastName = this.lastName();
  if (firstName && lastName) {
    return trim(firstName + " " + lastName);
  }
};

/**
 * Get the user's "unique id" from `userId`, `traits.username`, or
 * `traits.email`.
 *
 * This *should* be a string, but may not be if the client isn't adhering to
 * the spec.
 *
 * @return {string}
 */
i.uid = function () {
  return this.userId() || this.username() || this.email();
};

/**
 * Get the user's description from `traits.description` or `traits.background`.
 *
 * This *should* be a string, but may not be if the client isn't adhering to
 * the spec.
 *
 * @return {string}
 */
i.description = function () {
  return this.proxy("traits.description") || this.proxy("traits.background");
};

/**
 * Get the URL of the user's avatar from `traits.avatar`, `traits.photoUrl`, or
 * `traits.avatarUrl`.
 *
 * This *should* be a string, but may not be if the client isn't adhering to
 * the spec.
 *
 * @return {string}
 */
i.avatar = function () {
  let traits = this.traits();
  return (
    get(traits, "avatar") || get(traits, "photoUrl") || get(traits, "avatarUrl")
  );
};

/**
 * Get the user's username from `traits.username`.
 *
 * This *should* be a string, but may not be if the client isn't adhering to
 * the spec.
 *
 * @function
 * @return {string}
 */
i.username = Facade.proxy("traits.username");
