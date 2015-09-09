Buffer = require '../lib/controllers/buffer'

describe "Buffer", ->
  it "will trim the first line", ->
    buffer = new Buffer(10);
    buffer.push("12345");
    buffer.push("6789012");

    expect(buffer.getLineCount()).toEqual 2;
    expect(buffer.toString()).toEqual "3456789012";

  it "will remove the first line", ->
    buffer = new Buffer(10);
    buffer.push("12345");
    buffer.push("67890");
    buffer.push("abcde");

    expect(buffer.getLineCount()).toEqual 2;
    expect(buffer.toString()).toEqual "67890abcde";

  it "will remove multiple lines", ->
    buffer = new Buffer(10);
    buffer.push("12345");
    buffer.push("67890");
    buffer.push("abcdefghij");

    expect(buffer.getLineCount()).toEqual 1;
    expect(buffer.toString()).toEqual "abcdefghij";

  it "will remove multiple lines and trim", ->
    buffer = new Buffer(12);
    buffer.push("123");
    buffer.push("456");
    buffer.push("789");
    buffer.push("abc");
    buffer.push("de");

    expect(buffer.getLineCount()).toEqual 5;
    buffer.push("3456789abcde");

  it "will allow an undefined buffer size", ->
    buffer = new Buffer();
    buffer.push("12345");
    buffer.push("67890");
    buffer.push("abcde");

    expect(buffer.getLineCount()).toEqual 3;
    expect(buffer.toString()).toEqual "1234567890abcde";

    buffer = new Buffer(null);
    buffer.push("12345");
    buffer.push("67890");
    buffer.push("abcde");

    expect(buffer.getLineCount()).toEqual 3;
    expect(buffer.toString()).toEqual "1234567890abcde";

    buffer = new Buffer(undefined);
    buffer.push("12345");
    buffer.push("67890");
    buffer.push("abcde");

    expect(buffer.getLineCount()).toEqual 3;
    expect(buffer.toString()).toEqual "1234567890abcde";
