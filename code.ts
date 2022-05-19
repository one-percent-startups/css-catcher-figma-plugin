// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".

interface Element {
  childNodes: Array<Element>;
  innerText: String | undefined;
  nodeName: String;
  style: any;
  textContent: string | undefined;
  title: String | undefined;
}

interface Position {
  x: number;
  y: number;
}

figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
// figma.ui.onmessage = (msg) => {
// One way of distinguishing between different types of messages sent from
// your HTML page is to use an object with a "type" property like this.
// if (msg.type === "create-rectangles") {
// const nodes: SceneNode[] = [];
// for (let i = 0; i < msg.count; i++) {
//   const rect = figma.createRectangle();
//   rect.x = i * 150;
//   rect.fills = [{ type: "SOLID", color: { r: 0, g: 1, b: 0 } }];
//   figma.currentPage.appendChild(rect);
//   nodes.push(rect);
// }
// figma.currentPage.selection = nodes;
// figma.viewport.scrollAndZoomIntoView(nodes);
// }
// }

// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
//   figma.closePlugin();
// };

let nodes: SceneNode[] = [];

function clone(val: any): any {
  return JSON.parse(JSON.stringify(val));
}

function getColour(color: String): number[] {
  return color
    .substring(color.indexOf("(") + 1, color.lastIndexOf(")"))
    .split(/, \s*/)
    .map((c, idx) => {
      if (idx > 2) return parseInt(c);
      else return parseInt(c) / 255;
    });
}

function createFrame(element: Element): FrameNode {
  let el = figma.createFrame();
  if (
    !(
      isNaN(parseInt(element.style.width)) ||
      isNaN(parseInt(element.style.height))
    )
  ) {
    try {
      el.resize(parseInt(element.style.width), parseInt(element.style.height));
    } catch {
      // el.resize(0.01, 0.01);
    }
  }

  // if (
  //   !isNaN(parseInt(element.style.borderWidth)) &&
  //   parseInt(element.style.borderWidth)
  // ) {
  //   el.strokeWeight = parseInt(element.style.borderWidth);
  //   if (element.style.borderColor !== "transparent") {
  //     let strokes = clone(el.strokes);
  //     console.log("strokes", el.strokes, strokes);
  //     strokes[0].type = "SOLID";
  //     strokes[0].color.r = 0;
  //     strokes[0].color.g = 0;
  //     strokes[0].color.b = 0;
  //     el.strokes = strokes;
  //   }
  // }

  // console.log("background color", el.fills);
  let background = clone(el.fills);
  if (background) {
    let elBackground = getColour(element.style.backgroundColor);
    background[0].opacity = elBackground[3];
    background[0].color.r = elBackground[0];
    background[0].color.g = elBackground[1];
    background[0].color.b = elBackground[2];
    el.fills = background;
  }

  if (!isNaN(parseInt(element.style.borderRadius)))
    el.cornerRadius = parseInt(element.style.borderRadius);

  if (!isNaN(parseInt(element.style.paddingTop)))
    el.paddingTop = parseInt(element.style.paddingTop);
  if (!isNaN(parseInt(element.style.paddingBottom)))
    el.paddingBottom = parseInt(element.style.paddingBottom);
  if (!isNaN(parseInt(element.style.paddingLeft)))
    el.paddingLeft = parseInt(element.style.paddingLeft);
  if (!isNaN(parseInt(element.style.paddingRight)))
    el.paddingRight = parseInt(element.style.paddingRight);

  el.counterAxisAlignItems = "CENTER";
  el.primaryAxisAlignItems = "CENTER";

  switch (element.style.flexDirection) {
    case "row":
    case "row-reverse":
      el.layoutMode = "HORIZONTAL";
      if (
        element.style.display === "flex" &&
        element.style.justifyContent === "space-between"
      )
        el.primaryAxisAlignItems = "SPACE_BETWEEN";
      break;
    case "column":
    case "column-reverse":
      el.layoutMode = "VERTICAL";
      if (
        element.style.display === "flex" &&
        element.style.alignItems === "space-betweeen"
      )
        el.primaryAxisAlignItems = "SPACE_BETWEEN";
      break;
    default:
      el.layoutMode = "NONE";
      break;
  }
  if (element.childNodes.length > 0) {
    for (const ch of element.childNodes) {
      el.appendChild(createElement(ch));
    }
  }
  return el;
}

function createText(element: Element): TextNode {
  let el = figma.createText();
  el.characters = element.textContent;
  let color = clone(el.fills);
  if (color && "style" in element) {
    let elColor = getColour(element.style.color);
    console.log(element.textContent, elColor);
    color[0].opacity = elColor[3];
    color[0].color.r = elColor[0];
    color[0].color.g = elColor[1];
    color[0].color.b = elColor[2];
    el.fills = color;
  }
  return el;
}

function createElement(
  element: Element
  // parent: FrameNode
  // start: Position = { x: 0, y: 0 }
): SceneNode {
  // console.log("text contnet", element.textContent);
  if (element.nodeName === "#text") {
    return createText(element);
  } else if (element.nodeName === "SPAN") {
    if (
      element.childNodes.length === 1 &&
      element.childNodes[0].nodeName === "#text"
    ) {
      return createText(element);
    } else {
      return createFrame(element);
    }
  } else {
    return createFrame(element);
  }
}

figma.ui.onmessage = async (msg) => {
  if ("element" in msg) {
    console.log(msg.element);
    // nodes = [];
    // await createElement(msg.element);
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    figma.currentPage.appendChild(createElement(msg.element));
    // console.log(nodes);
    // figma.currentPage.selection = nodes;
    // figma.viewport.scrollAndZoomIntoView(nodes);
  }
  if (msg.shouldClose) {
    figma.closePlugin();
  }
};

// This plugin counts the number of layers, ignoring instance sublayers,
// in the document
// let count = 0
// function traverse(node) {
//   if ("children" in node) {
//     count++
//     if (node.type !== "INSTANCE") {
//       for (const child of node.children) {
//         traverse(child)
//       }
//     }
//   }
// }
// traverse(figma.root) // start the traversal at the root
// alert(count)
// figma.closePlugin()

// Skip over invisible nodes and their descendants inside instances for faster performance
// figma.skipInvisibleInstanceChildren = true

// Finds all component and component set nodes
// const nodes = node.findAllWithCriteria({
//   types: ['COMPONENT', 'COMPONENT_SET']
// })
