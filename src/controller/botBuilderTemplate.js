'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = process.env.LOG_LEVEL;
const breakText = require(global.rootPath + "/controller/utils/breakText.js");
function isUrl(url) {
  const pattern = /^[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,63}\b(\/[-a-zA-Z0-9@:%_\(\)\+.,~#?&//=]*)?$/gi;
  return pattern.test(url);
};
function isNumber(number) {
  return !isNaN(parseFloat(number)) && isFinite(number);
}

class FacebookTemplate {
  constructor() {
    this.template = {};
    this.templateApi = {};
  }

  setNotificationType(type) {
    if (type !== 'REGULAR' && type !== 'SILENT_PUSH' && type !== 'NO_PUSH')
      logger.debug('Notification type must be one of REGULAR, SILENT_PUSH, or NO_PUSH');
    this.template.notification_type = type;
    return this;
  }

  addQuickReply(text, payload, imageUrl) {
    if (!text || !payload)
      logger.debug('Both text and payload are required for a quick reply');

    if (payload.length > 1000)
      logger.debug('Payload can not be more than 1000 characters long');
    if (imageUrl && !isUrl(imageUrl))
      logger.debug('Image has a bad url');

    if (!this.template.quick_replies)
      this.template.quick_replies = [];

    if (this.template.quick_replies.length === 11)
      logger.debug('There can not be more than 11 quick replies');

    if (text.length > 20)
      text = breakText(text, 20)[0];

    let quickReply = {
      content_type: 'text',
      title: text,
      payload: payload
    };

    if (imageUrl) quickReply.image_url = imageUrl;

    this.template.quick_replies.push(quickReply);

    return this;
  }

  addQuickReplyLocation() {
    if (!this.template.quick_replies)
      this.template.quick_replies = [];

    if (this.template.quick_replies.length === 11)
      logger.debug('There can not be more than 11 quick replies');

    let quickReply = {
      content_type: 'location'
    };

    this.template.quick_replies.push(quickReply);

    return this;
  }

  get() {
    return this.template;
  }
  getApi(jsonArray){
    this.templateApi = {
      "data" : {"facebook" : jsonArray}
    }
    return this.templateApi;
  }
}

class Text extends FacebookTemplate {
  constructor(text) {
    super();

    if (!text)
      logger.debug('Text is required for text template');

    this.template = {
      text: text
    };
  }
}

class Attachment extends FacebookTemplate {
  constructor(url, type) {
    super();

    if (!url || !isUrl(url))
      logger.debug('Attachment template requires a valid URL as a first parameter');

    this.template = {
      attachment: {
        type: type || 'file',
        payload: {
          url: url
        }
      }
    };
  }
}

class Image extends FacebookTemplate {
  constructor(url) {
    super();

    if (!url || !isUrl(url))
      logger.debug('Image template requires a valid URL as a first parameter');

    this.template = {
      attachment: {
        type: 'image',
        payload: {
          url: url
        }
      }
    };
  }
}

class Audio extends FacebookTemplate {
  constructor(url) {
    super();

    if (!url || !isUrl(url))
      logger.debug('Audio template requires a valid URL as a first parameter');

    this.template = {
      attachment: {
        type: 'audio',
        payload: {
          url: url
        }
      }
    };
  }
}

class Video extends FacebookTemplate {
  constructor(url) {
    super();
    if (!url || !isUrl(url))
      logger.debug('Video template requires a valid URL as a first parameter');

    this.template = {
      attachment: {
        type: 'video',
        payload: {
          url: url
        }
      }
    };
  }
}

class File extends FacebookTemplate {
  constructor(url) {
    super();

    if (!url || !isUrl(url))
      logger.debug('File attachment template requires a valid URL as a first parameter');

    this.template = {
      attachment: {
        type: 'file',
        payload: {
          url: url
        }
      }
    };
  }
}

class Generic extends FacebookTemplate {
  constructor() {
    super();

    this.bubbles = [];

    this.template = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: []
        }
      }
    };
  }

  useSquareImages() {
    this.template.attachment.payload.image_aspect_ratio = 'square';

    return this;
  }

  getLastBubble() {
    if (!this.bubbles || !this.bubbles.length)
      logger.debug('Add at least one bubble first!');

    return this.bubbles[this.bubbles.length - 1];
  }

  addBubble(title, subtitle) {
    if (this.bubbles.length === 10)
      logger.debug('10 bubbles are maximum for Generic template');

    if (!title)
      logger.debug('Bubble title cannot be empty');

    if (title.length > 80)
      logger.debug('Bubble title cannot be longer than 80 characters');

    if (subtitle && subtitle.length > 80)
      logger.debug('Bubble subtitle cannot be longer than 80 characters');

    let bubble = {
      title: title
    };

    if (subtitle)
      bubble['subtitle'] = subtitle;

    this.bubbles.push(bubble);

    return this;
  }

  addUrl(url) {
    if (!url)
      logger.debug('URL is required for addUrl method');

    if (!isUrl(url))
      logger.debug('URL needs to be valid for addUrl method');

    this.getLastBubble()['item_url'] = url;

    return this;
  }

  addImage(url) {
    if (!url)
      logger.debug('Image URL is required for addImage method');

    if (!isUrl(url))
      logger.debug('Image URL needs to be valid for addImage method');

    this.getLastBubble()['image_url'] = url;

    return this;
  }

  addButtonByType(title, value, type, options) {
    if (!title)
      logger.debug('Button title cannot be empty');

    const bubble = this.getLastBubble();

    bubble.buttons = bubble.buttons || [];

    if (bubble.buttons.length === 3)
      logger.debug('3 buttons are already added and that\'s the maximum');

    if (!title)
      logger.debug('Button title cannot be empty');

    const button = {
      title: title,
      type: type || 'postback'
    };

    if (type === 'web_url') {
      button.url = value;
    } else if (type === 'account_link') {
      delete button.title;
      button.url = value;
    } else if (type === 'phone_number') {
      button.payload = value;
    } else if (type === 'payment') {
      button.payload = value;
      button.payment_summary = options.paymentSummary;
    } else if (type === 'element_share' || type === 'account_unlink') {
      delete button.title;
      if (type === 'element_share' && options && typeof options.shareContent)
        button.share_contents = options.shareContent;
    } else {
      button.type = 'postback';
      button.payload = value;
    }

    bubble.buttons.push(button);

    return this;
  }

  addButton(title, value) {
    // Keeping this to prevent breaking change
    if (!title)
      logger.debug('Button title cannot be empty');

    if (!value)
      logger.debug('Button value is required');

    if (isUrl(value)) {
      return this.addButtonByType(title, value, 'web_url');
    } else {
      return this.addButtonByType(title, value, 'postback');
    }
  }

  addCallButton(title, phoneNumber) {
    if (!/^\+[0-9]{4,20}$/.test(phoneNumber))
      logger.debug('Call button value needs to be a valid phone number in following format: +1234567...');

    return this.addButtonByType(title, phoneNumber, 'phone_number');
  }

  addShareButton(shareContent) {
    return this.addButtonByType('Share', null, 'element_share', {
      shareContent: shareContent || null
    });
  }

  addBuyButton(title, value, paymentSummary) {
    if (!value)
      logger.debug('Button value is required');

    if (typeof paymentSummary !== 'object')
      logger.debug('Payment summary is required for buy button');

    return this.addButtonByType(title, value, 'payment', {
      paymentSummary: paymentSummary
    });
  }

  addLoginButton(url) {
    if (!isUrl(url))
      logger.debug('Valid URL is required for Login button');

    return this.addButtonByType('Login', url, 'account_link');
  }

  addLogoutButton() {
    return this.addButtonByType('Logout', null, 'account_unlink');
  }

  get() {
    if (!this.bubbles || !this.bubbles.length)
      logger.debug('Add at least one bubble first!');

    this.template.attachment.payload.elements = this.bubbles;

    return this.template;
  }
}

class Button extends FacebookTemplate {
  constructor(text) {
    super();

    if (!text)
      logger.debug('Button template text cannot be empty');

    if (text.length > 640)
      logger.debug('Button template text cannot be longer than 640 characters');

    this.template = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: text,
          buttons: []
        }
      }
    };
  }

  addButtonByType(title, value, type, options) {
    if (!title)
      logger.debug('Button title cannot be empty');

    if (this.template.attachment.payload.buttons.length === 3)
      logger.debug('3 buttons are already added and that\'s the maximum');

    const button = {
      title: title,
      type: type || 'postback'
    };

    if (type === 'web_url') {
      button.url = value;
    } else if (type === 'account_link') {
      delete button.title;
      button.url = value;
    } else if (type === 'phone_number') {
      button.payload = value;
    } else if (type === 'payment') {
      button.payload = value;
      button.payment_summary = options.paymentSummary;
    } else if (type === 'element_share' || type === 'account_unlink') {
      delete button.title;
      if (type === 'element_share' && options && typeof options.shareContent)
        button.share_contents = options.shareContent;
    } else {
      button.type = 'postback';
      button.payload = value;
    }

    this.template.attachment.payload.buttons.push(button);

    return this;
  }

  addButton(title, value) {
    // Keeping this to prevent breaking change
    if (!title)
      logger.debug('Button title cannot be empty');

    if (!value)
      logger.debug('Button value is required');

    if (isUrl(value)) {
      return this.addButtonByType(title, value, 'web_url');
    } else {
      return this.addButtonByType(title, value, 'postback');
    }
  }

  addCallButton(title, phoneNumber) {
    if (!/^\+[0-9]{4,20}$/.test(phoneNumber))
      logger.debug('Call button value needs to be a valid phone number in following format: +1234567...');

    return this.addButtonByType(title, phoneNumber, 'phone_number');
  }

  addShareButton(shareContent) {
    return this.addButtonByType('Share', null, 'element_share', {
      shareContent: shareContent || null
    });
  }

  addBuyButton(title, value, paymentSummary) {
    if (!value)
      logger.debug('Button value is required');

    if (typeof paymentSummary !== 'object')
      logger.debug('Payment summary is required for buy button');

    return this.addButtonByType(title, value, 'payment', {
      paymentSummary: paymentSummary
    });
  }

  addLoginButton(url) {
    if (!isUrl(url))
      logger.debug('Valid URL is required for Login button');

    return this.addButtonByType('Login', url, 'account_link');
  }

  addLogoutButton() {
    return this.addButtonByType('Logout', null, 'account_unlink');
  }

  get() {
    if (this.template.attachment.payload.buttons.length === 0)
       logger.debug('Add at least one button first!');

    return this.template;
  }
}

class Receipt extends FacebookTemplate {
  constructor(name, orderNumber, currency, paymentMethod) {
    super();

    if (!name)
      logger.debug('Recipient\'s name cannot be empty');

    if (!orderNumber)
      logger.debug('Order number cannot be empty');

    if (!currency)
      logger.debug('Currency cannot be empty');

    if (!paymentMethod)
      logger.debug('Payment method cannot be empty');

    this.template = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'receipt',
          recipient_name: name,
          order_number: orderNumber,
          currency: currency,
          payment_method: paymentMethod,
          elements: [],
          summary: {}
        }
      }
    };
  }

  addTimestamp(timestamp) {
    if (!timestamp)
      logger.debug('Timestamp is required for addTimestamp method');

    if (!(timestamp instanceof Date))
      logger.debug('Timestamp needs to be a valid Date object');

    this.template.attachment.payload.timestamp = timestamp.getTime();

    return this;
  }

  addOrderUrl(url) {
    if (!url)
      logger.debug('Url is required for addOrderUrl method');

    if (!isUrl(url))
      logger.debug('Url needs to be valid for addOrderUrl method');

    this.template.attachment.payload.order_url = url;

    return this;
  }

  getLastItem() {
    if (!this.template.attachment.payload.elements || !this.template.attachment.payload.elements.length)
      logger.debug('Add at least one order item first!');

    return this.template.attachment.payload.elements[this.template.attachment.payload.elements.length - 1];
  }

  addItem(title) {
    if (!title)
      logger.debug('Item title is required');

    this.template.attachment.payload.elements.push({
      title: title
    });

    return this;
  }

  addSubtitle(subtitle) {
    if (!subtitle)
      logger.debug('Subtitle is required for addSubtitle method');

    let item = this.getLastItem();

    item.subtitle = subtitle;

    return this;
  }

  addQuantity(quantity) {
    if (!quantity)
      logger.debug('Quantity is required for addQuantity method');

    if (!isNumber(quantity))
      logger.debug('Quantity needs to be a number');

    let item = this.getLastItem();

    item.quantity = quantity;

    return this;
  }

  addPrice(price) {
    if (!price)
      logger.debug('Price is required for addPrice method');

    if (!isNumber(price))
      logger.debug('Price needs to be a number');

    let item = this.getLastItem();

    item.price = price;

    return this;
  }

  addCurrency(currency) {
    if (!currency)
      logger.debug('Currency is required for addCurrency method');

    let item = this.getLastItem();

    item.currency = currency;

    return this;
  }

  addImage(image) {
    if (!image)
      logger.debug('Absolute url is required for addImage method');

    if (!isUrl(image))
      logger.debug('Valid absolute url is required for addImage method');

    let item = this.getLastItem();

    item.image_url = image;

    return this;
  }

  addShippingAddress(street1, street2, city, zip, state, country) {
    if (!street1)
      logger.debug('Street is required for addShippingAddress');

    if (!city)
      logger.debug('City is required for addShippingAddress method');

    if (!zip)
      logger.debug('Zip code is required for addShippingAddress method');

    if (!state)
      logger.debug('State is required for addShippingAddress method');

    if (!country)
      logger.debug('Country is required for addShippingAddress method');

    this.template.attachment.payload.address = {
      street_1: street1,
      street_2: street2 || '',
      city: city,
      postal_code: zip,
      state: state,
      country: country
    };

    return this;
  }

  addAdjustment(name, amount) {
    if (!amount || !isNumber(amount))
      logger.debug('Adjustment amount must be a number');

    let adjustment = {};

    if (name)
      adjustment.name = name;

    if (amount)
      adjustment.amount = amount;

    if (name || amount) {
      this.template.attachment.payload.adjustments = this.template.attachment.payload.adjustments || [];
      this.template.attachment.payload.adjustments.push(adjustment);
    }

    return this;
  }

  addSubtotal(subtotal) {
    if (!subtotal)
      logger.debug('Subtotal is required for addSubtotal method');

    if (!isNumber(subtotal))
      logger.debug('Subtotal must be a number');

    this.template.attachment.payload.summary.subtotal = subtotal;

    return this;
  }

  addShippingCost(shippingCost) {
    if (!shippingCost)
      logger.debug('shippingCost is required for addShippingCost method');

    if (!isNumber(shippingCost))
      logger.debug('Shipping cost must be a number');

    this.template.attachment.payload.summary.shipping_cost = shippingCost;

    return this;
  }

  addTax(tax) {
    if (!tax)
      logger.debug('Total tax amount is required for addSubtotal method');

    if (!isNumber(tax))
      logger.debug('Total tax amount must be a number');

    this.template.attachment.payload.summary.total_tax = tax;

    return this;
  }

  addTotal(total) {
    if (!total)
      logger.debug('Total amount is required for addSubtotal method');

    if (!isNumber(total))
      logger.debug('Total amount must be a number');

    this.template.attachment.payload.summary.total_cost = total;

    return this;
  }

  get() {
    if (!this.template.attachment.payload.elements.length)
      logger.debug('At least one element/item is required');

    if (!this.template.attachment.payload.summary.total_cost)
      logger.debug('Total amount is required');

    return this.template;
  }
}

class List extends FacebookTemplate {
  constructor(topElementStyle) {
    super();

    this.bubbles = [];

    this.template = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: topElementStyle ? topElementStyle : 'large',
          elements: [],
          buttons: []
        }
      }
    };
  }

  getFirstBubble() {
    if (!this.bubbles || !this.bubbles.length)
      logger.debug('Add at least one bubble first!');

    return this.bubbles[0];
  }

  getLastBubble() {
    if (!this.bubbles || !this.bubbles.length)
      logger.debug('Add at least one bubble first!');

    return this.bubbles[this.bubbles.length - 1];
  }

  addBubble(title, subtitle) {
    if (this.bubbles.length === 4)
      logger.debug('4 bubbles are maximum for List template');

    if (!title)
      logger.debug('Bubble title cannot be empty');

    if (title.length > 80)
      logger.debug('Bubble title cannot be longer than 80 characters');

    if (subtitle && subtitle.length > 80)
      logger.debug('Bubble subtitle cannot be longer than 80 characters');

    let bubble = {
      title: title
    };

    if (subtitle)
      bubble['subtitle'] = subtitle;

    this.bubbles.push(bubble);

    return this;
  }

  addImage(url) {
    if (!url)
      logger.debug('Image URL is required for addImage method');

    if (!isUrl(url))
      logger.debug('Image URL needs to be valid for addImage method');

    this.getLastBubble()['image_url'] = url;

    return this;
  }

  addDefaultAction(url) {
    const bubble = this.getLastBubble();

    if (bubble.default_action)
      logger.debug('Bubble already has default action');

    if (!url)
      logger.debug('Bubble default action URL is required');

    if (!isUrl(url))
      logger.debug('Bubble default action URL must be valid URL');

    bubble.default_action = {
      type: 'web_url',
      url: url
    };

    return this;
  }

  addButton(title, value, type) {
    const bubble = this.getLastBubble();

    bubble.buttons = bubble.buttons || [];

    if (bubble.buttons.length === 1)
      logger.debug('One button is already added and that\'s the maximum');

    if (!title)
      logger.debug('Button title cannot be empty');

    if (!value)
      logger.debug('Button value is required');

    const button = {
      title: title
    };

    if (isUrl(value)) {
      button.type = 'web_url';
      button.url = value;
    } else {
      button.type = 'postback';
      button.payload = value;
    }

    if (type) {
      button.type = type;
    }

    bubble.buttons.push(button);

    return this;
  }

  addShareButton() {
    const bubble = this.getLastBubble();

    bubble.buttons = bubble.buttons || [];

    if (bubble.buttons.length === 1)
      logger.debug('One button is already added and that\'s the maximum');
    const button = {
      type: 'element_share'
    };

    bubble.buttons.push(button);

    return this;
  }

  addListButton(title, value, type) {
    if (this.template.attachment.payload.buttons.length === 1)
      logger.debug('One List button is already added and that\'s the maximum');

    if (!title)
      logger.debug('List button title cannot be empty');

    if (!value)
      logger.debug('List button value is required');

    const button = {
      title: title
    };

    if (isUrl(value)) {
      button.type = 'web_url';
      button.url = value;
    } else {
      button.type = 'postback';
      button.payload = value;
    }

    if (type) {
      button.type = type;
    }

    this.template.attachment.payload.buttons.push(button);

    return this;
  }

  get() {
    if (!this.bubbles || !this.bubbles.length || this.bubbles.length < 2)
      logger.debug('2 bubbles are minimum for List template!');

    if (this.template.attachment.payload.top_element_style === 'large' && !this.getFirstBubble()['image_url'])
      logger.debug('You need to add image to the first bubble because you use `large` top element style');

    this.template.attachment.payload.elements = this.bubbles;

    return this.template;
  }
}

class ChatAction {
  constructor(action) {
    const AVAILABLE_TYPES = ['typing_on', 'typing_off', 'mark_seen'];

    if (AVAILABLE_TYPES.indexOf(action) < 0)
      logger.debug('Valid action is required for Facebook ChatAction template. Available actions are: typing_on, typing_off and mark_seen.');

    this.template = {
      sender_action: action
    };
  }

  get() {
    return this.template;
  }
}

class Pause {
  constructor(milliseconds) {
    this.template = {
      claudiaPause: milliseconds || 500
    };
  }

  get() {
    return this.template;
  }
}


module.exports = {
  BaseTemplate: FacebookTemplate,
  Text: Text,
  Attachment: Attachment,
  Image: Image,
  Audio: Audio,
  Video: Video,
  File: File,
  Generic: Generic,
  Button: Button,
  Receipt: Receipt,
  List: List,
  ChatAction: ChatAction,
  Pause: Pause
};
