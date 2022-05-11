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

async function createElement(
  element: Element,
  start: Position = { x: 0, y: 0 }
): Promise<void> {
  let el: SceneNode;
  if (element.nodeName === "#text") {
    el = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    el.characters = element.textContent;
  } else {
    el = figma.createRectangle();
    el.resize(
      parseInt(element.style?.width) || 0.01,
      parseInt(element.style?.height) || 0.01
    );
    el.opacity = 0.5;
  }
  el.x = start.x;
  el.y = start.y;
  figma.currentPage.appendChild(el);
  if (element.childNodes.length > 0) {
    for (const ch of element.childNodes) {
      await createElement(ch, { x: el.x, y: el.y });
    }
  }
}

figma.ui.onmessage = async (msg) => {
  if ("element" in msg) {
    console.log(msg.element);
    await createElement(msg.element);
  }
  figma.closePlugin();
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
