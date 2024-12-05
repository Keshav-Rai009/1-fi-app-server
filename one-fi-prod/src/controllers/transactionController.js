const { v4: uuidv4 } = require("uuid");
//const User = require("../models/User"); // Import the User model
const axios = require("axios"); // Import axios for making HTTP requests
const { verifyJwtToken } = require("../utils/jwtUtil");
const {
  firebaseAdmin,
  saveFirestoreData,
  firestoreDB,
} = require("../config/firebase");

function generateTransactionNo(memberId) {
  // Get the current date in the required format: YYYYMMDD
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so +1
  const day = String(date.getDate()).padStart(2, "0");

  const datePart = `${year}${month}${day}`;

  // Generate a random number with enough digits to make the transaction number length 19
  const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6 digit random number

  return `${datePart}${memberId}${randomNumber}`;
}

const initiate2FA = async (payload) => {
  //const { loginId, password, membercode, clientcode } = payload;

  const twoFaEndpoint = `https://bsestarmf.in/BSEMFWEBAPI/api/_2FA_AuthenticationController/_2FA_Authentication/w`;

  //console.log("2fa")
  try {
    const response = await axios({
      method: "post",
      url: twoFaEndpoint,
      headers: {},
      data: {
        loginId: "6157802",
        password: "BSE@2025",
        membercode: "61578",
        clientcode: "10006",
        primaryholder: "1",
        loopbackURL: "",
        internalrefno: "9953972289",
        allowloopBack: "",
      },
    });
    //console.log(response.data);
    return { twoFaResponse: response.data };
  } catch (error) {
    console.error("Error initiating 2FA:", error, error.response?.data);
    throw new Error({
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        message: "Error initiating 2FA:",
        details: error.message,
      }),
    });
  }
};

class TransactionController {
  constructor() {
    this.getBsePassword = this.getBsePassword.bind(this);
    this.placeBseLumpsumOrder = this.placeBseLumpsumOrder.bind(this);
    // this.generateOtp = this.generateOtp.bind(this);
    // this.verifyOtp = this.verifyOtp.bind(this);
  }

  async getBsePassword(payload) {
    //console.log(payload);
    const { userId: UserId, password: Password, passKey: PassKey } = payload;
    const soapRequest = `
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:bses="http://bsestarmf.in/">
        <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
            <wsa:Action>http://bsestarmf.in/MFOrderEntry/getPassword</wsa:Action>
            <wsa:To>https://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc/Secure</wsa:To>
        </soap:Header>
        <soap:Body>
            <bses:getPassword>
                <bses:UserId>${UserId}</bses:UserId>
                <bses:Password>${Password}</bses:Password>
                <bses:PassKey>${PassKey}</bses:PassKey>
            </bses:getPassword>
        </soap:Body>
    </soap:Envelope>
`;

    const config = {
      method: "post",
      url: "https://bsestarmf.in/MFOrderEntry/MFOrder.svc/Secure",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        SOAPAction: "http://bsestarmf.in/MFOrderEntry/getPassword",
      },
      data: soapRequest,
    };

    try {
      const response = await axios(config);
      const responseSplits = response.data.split("<getPasswordResult>");
      const dataSplits = responseSplits[1].split("|");
      //console.log(response.data);

      if (dataSplits[0] === "100") {
        const splits = dataSplits[1].split("</getPasswordResult>");
        return { bsePassword: splits[0] };
      } else {
        throw new Error("Failed to retrieve password");
      }
    } catch (error) {
      console.error("Error calling SOAP API:", error);
      throw new Error("Error calling SOAP API:", error.message);
    }
  }

  async placeBseLumpsumOrder(req, res) {
    //console.log("HIiiiis")
    const {
      userId = "6157802",
      memberId = "61578",
      clientCode = "10006",
      schemeCd = "02-DP",
      buySell = "P",
      buySellType = "FRESH",
      orderVal = "2000",
      subBrCode = "12345",
      kycStatus = "Y",
      dptxn = "P",
      passKey = "BSE@123",
      phoneNo,
      orderType,
    } = req.body;

    const transNo = generateTransactionNo(memberId);

    // const transactionData = {
    //     uid: uuidv4(),
    //     user_id: phoneNo,
    //     transaction_time: new Date().toISOString(),
    //     order_type: orderType || "lumpsum",
    //     bank_details: null,
    //     order_value: orderVal,
    //   };
    //   await saveFirestoreData("transactions", transactionData);

    const { bsePassword } = await this.getBsePassword(req.body);
    console.log(bsePassword);
    const soapRequest = `
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:bses="http://bsestarmf.in/">
    <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
        <wsa:Action>http://bsestarmf.in/MFOrderEntry/orderEntryParam</wsa:Action>
        <wsa:To>https://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc/Secure</wsa:To>
    </soap:Header>
    <soap:Body>
    <bses:orderEntryParam>
    <bses:TransCode>NEW</bses:TransCode>
    <bses:TransNo>${transNo}</bses:TransNo>
    <bses:OrderId></bses:OrderId>
    <bses:UserID>${userId}</bses:UserID>
    <bses:MemberId>${memberId}</bses:MemberId>
    <bses:ClientCode>${clientCode}</bses:ClientCode>
    <bses:SchemeCd>${schemeCd}</bses:SchemeCd>
    <bses:BuySell>${buySell}</bses:BuySell>
    <bses:BuySellType>${buySellType}</bses:BuySellType>
    <bses:DPTxn>${dptxn}</bses:DPTxn>
    <bses:OrderVal>${orderVal}</bses:OrderVal>
    <bses:Qty></bses:Qty>
    <bses:AllRedeem>N</bses:AllRedeem>
    <bses:FolioNo></bses:FolioNo>
    <bses:Remarks></bses:Remarks>
    <bses:KYCStatus>${kycStatus}</bses:KYCStatus>
    <bses:RefNo></bses:RefNo>
    <bses:SubBrCode>${subBrCode}</bses:SubBrCode>
    <bses:EUIN></bses:EUIN>
    <bses:EUINVal>N</bses:EUINVal>
    <bses:MinRedeem>N</bses:MinRedeem>
    <bses:DPC>Y</bses:DPC>
    <bses:IPAdd></bses:IPAdd>
    <bses:Password>${bsePassword}</bses:Password>
    <bses:PassKey>${passKey}</bses:PassKey>
    <bses:Parma1></bses:Parma1>
    <bses:Param2></bses:Param2>
    <bses:Param3></bses:Param3>
    <bses:MobileNo></bses:MobileNo>
    <bses:EmailID></bses:EmailID>
    <bses:MandateID></bses:MandateID>
    <bses:Filler1></bses:Filler1>
    <bses:Filler2></bses:Filler2>
    <bses:Filler3></bses:Filler3>
    <bses:Filler4></bses:Filler4>
    <bses:Filler5></bses:Filler5>
    <bses:Filler6></bses:Filler6>
    </bses:orderEntryParam>
    </soap:Body>
</soap:Envelope>
`;

    const config = {
      method: "post",
      url: "https://bsestarmf.in/MFOrderEntry/MFOrder.svc/Secure",
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        //'SOAPAction': 'http://bsestarmf.in/MFOrderEntry/getPassword'
      },
      data: soapRequest,
    };

    try {
      const response = await axios(config);
      //console.log(response);
      const { twoFaResponse } = await initiate2FA();
      console.log(twoFaResponse.ResponseString, twoFaResponse.ResponseCode);

      if (twoFaResponse.ResponseCode === "100") {
        const transactionData = {
          uid: uuidv4(),
          user_id: phoneNo,
          transaction_time: new Date().toISOString(),
          order_type: orderType || "lumpsum",
          bank_details: null,
          order_value: orderVal,
        };
        await saveFirestoreData("transactions", transactionData);
        return res
          .status(200)
          .json({ response: response.data, twoFaResponse, transactionData });
      } else if (twoFaResponse.ResponseCode === "101") {
        return res.status(500).json({
          message:
            "Error initiating 2FA for placing BSE lumpsum order: " +
            twoFaResponse.ResponseString,
        });
      }

      //return { response: response.data, twoFaResponse };
    } catch (error) {
      console.log(error);
      console.error(
        "Error placing BSE lumpsum order: ",
        error.message,
        error.response?.data
      );

      return res.status(500).json({
        statusCode: error.response?.status || 500,
        body: JSON.stringify({
          message: "Error placing BSE lumpsum order",
          details: error.message,
        }),
      });
    }
  }
}

module.exports = new TransactionController();
