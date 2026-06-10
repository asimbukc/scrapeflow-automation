import LaunchBrowserNode from "./nodes/LaunchBrowserNode";
import NavigateNode from "./nodes/NavigateNode";
import FillInputNode from "./nodes/FillInputNode";
import PressEnterNode from "./nodes/PressEnterNode";
import ScrollToElementNode from "./nodes/ScrollToElementNode";
import GetHtmlNode from "./nodes/GetHtmlNode";
import ExtractTextNode from "./nodes/ExtractTextNode";
import ExtractAINode from "./nodes/ExtractAINode";
import ReadJsonNode from "./nodes/ReadJsonNode";
import ExtractNestedJsonNode from "./nodes/ExtractNestedJsonNode";
import WaitNode from "./nodes/WaitNode";
import ApiDeliveryNode from "./nodes/ApiDeliveryNode";
export default function ScraperNode({ id, data }) {
  switch (data.type) {
    case "launchBrowser":
      return <LaunchBrowserNode id={id} data={data} />;
    case "navigate":
      return <NavigateNode id={id} data={data} />;
    case "fillInput":
      return <FillInputNode id={id} data={data} />;
    case "pressEnter":
    case "clickElement":
      return <PressEnterNode id={id} data={data} />;
    case "scrollToElement":
      return <ScrollToElementNode id={id} data={data} />;
    case "getHtml":
      return <GetHtmlNode id={id} data={data} />;
    case "extractText":
      return <ExtractTextNode id={id} data={data} />;
    case "extractAI":
      return <ExtractAINode id={id} data={data} />;
    case "readJson":
      return <ReadJsonNode id={id} data={data} />;
    case "nestedJson":
      return <ExtractNestedJsonNode id={id} data={data} />;
    case "wait":
      return <WaitNode id={id} data={data} />;
    case "apiDelivery":
      return <ApiDeliveryNode id={id} data={data} />;
    default:
      return <LaunchBrowserNode id={id} data={data} />;
  }
}
