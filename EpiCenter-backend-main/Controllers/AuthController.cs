using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Services;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Xml;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(IAuthService _authService, IConfiguration configuration) : ControllerBase
    {

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            try
            {
                var details = await _authService.ValidateUser(model!);

                return Ok(details);
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal Server Error");
            }
        }

        [HttpPost("callback")]
        public async Task<IActionResult> OktaUserValidationCallback([FromForm] string SAMLResponse)
        {
            try
            {
                // Decode the SAML response
                var samlBytes = Convert.FromBase64String(SAMLResponse);
                var samlXml = Encoding.UTF8.GetString(samlBytes);

                // Parse the XML
                var xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(samlXml);

                var nsManager = new XmlNamespaceManager(xmlDoc.NameTable);
                nsManager.AddNamespace("saml2", "urn:oasis:names:tc:SAML:2.0:assertion");

                var nameId = xmlDoc.SelectSingleNode("//saml2:Subject/saml2:NameID", nsManager)?.InnerText;
                var email = xmlDoc.SelectSingleNode("//saml2:Attribute[@Name='email']/saml2:AttributeValue", nsManager)?.InnerText;

                if (string.IsNullOrEmpty(email))
                    return Unauthorized("Email not found in SAML response");

                // Generate your token or response
                var responseObj = await _authService.ValidateUser(new LoginDto { Email = email });

                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };

                var base64Payload = WebUtility.UrlEncode(
                    Convert.ToBase64String(
                        Encoding.UTF8.GetBytes(JsonSerializer.Serialize(responseObj, options))
                    )
                );

                var clientUrl = configuration["ClientHostName"] ?? "http://localhost:3000";
                var redirectUrl = $"{clientUrl}?payload={base64Payload}";

                return Redirect(redirectUrl);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal Server Error: {ex.Message}\n\n{ex.InnerException}");
            }
        }
    }
}