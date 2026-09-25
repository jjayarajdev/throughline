using System.Text.Json;
using System.Text.Json.Nodes;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace EpicenterX.Utility
{

    public static class Utility
    {

        public static Dictionary<string, string> ObjectDictionary<T>(object obj)
        {
            // Convert to JSON string
            string json = JsonConvert.SerializeObject(obj);



            return JsonConvert.DeserializeObject<Dictionary<string, string>>(json) ?? new Dictionary<string, string>();
        }

        public static Dictionary<string, string> FlattenJsonToDictionary(string json)
        {
            var dict = new Dictionary<string, string>();
            var token = JToken.Parse(json);

            void Recurse(JToken node, string prefix)
            {
                if (node is JValue value)
                {
                    dict[prefix] = value.ToString();
                }
                else if (node is JObject obj)
                {
                    foreach (var prop in obj.Properties())
                    {
                        var childPrefix = string.IsNullOrEmpty(prefix) ? prop.Name : $"{prefix}.{prop.Name}";
                        Recurse(prop.Value, childPrefix);
                    }
                }
                else if (node is JArray arr)
                {
                    for (int i = 0; i < arr.Count; i++)
                    {
                        var childPrefix = $"{prefix}[{i}]";
                        Recurse(arr[i], childPrefix);
                    }
                }
            }

            Recurse(token, "");
            return dict;
        }

        public static Dictionary<string, string> GetTopLevelProperties(string json, string prefix)
        {
            var dict = new Dictionary<string, string>();
            var token = JToken.Parse(json);

            if (token is JObject obj)
            {
                foreach (var prop in obj.Properties())
                {
                    string prefixedKey = $"{prefix}{prop.Name}";

                    if (prop.Value is JValue value)
                    {
                        dict[prefixedKey] = value.ToString();
                    }
                    else
                    {
                        dict[prefixedKey] = $"[Complex Object - {prop.Value.Type}]";
                    }
                }
            }

            return dict;
        }


        public static Dictionary<string, string> FlattenDeepJsonToDictionary(string json, int maxDepth = 2)
        {
            var dict = new Dictionary<string, string>();
            var visitedObjects = new HashSet<object>();
            var token = JToken.Parse(json);

            void Recurse(JToken node, string prefix, int currentDepth)
            {
                // Prevent infinite loops with circular references
                if (node is JObject jsonObject)
                {
                    var hashCode = jsonObject.GetHashCode();
                    if (visitedObjects.Contains(hashCode))
                    {
                        dict[prefix] = "[Circular Reference]";
                        return;
                    }
                    visitedObjects.Add(hashCode);
                }

                // Limit depth to prevent deep recursion
                if (currentDepth >= maxDepth)
                {
                    dict[prefix] = "[Max Depth Reached]";
                    return;
                }

                if (node is JValue value)
                {
                    dict[prefix] = value.ToString();
                }
                else if (node is JObject jsonObj)
                {
                    foreach (var prop in jsonObj.Properties())
                    {
                        var childPrefix = string.IsNullOrEmpty(prefix) ? prop.Name : $"{prefix}.{prop.Name}";
                        Recurse(prop.Value, childPrefix, currentDepth + 1);
                    }
                }
                else if (node is JArray arr)
                {
                    // Only process first few items to avoid large arrays
                    var itemsToProcess = Math.Min(arr.Count, 10);
                    for (int i = 0; i < itemsToProcess; i++)
                    {
                        var childPrefix = $"{prefix}[{i}]";
                        Recurse(arr[i], childPrefix, currentDepth + 1);
                    }

                    if (arr.Count > itemsToProcess)
                    {
                        dict[$"{prefix}[...]"] = $"[Array truncated - showing {itemsToProcess} of {arr.Count} items]";
                    }
                }
            }

            Recurse(token, "", 0);
            return dict;
        }

        public static Dictionary<TKey, TValue> Merge<TKey, TValue>(
    Dictionary<TKey, TValue> first,
    Dictionary<TKey, TValue> second)
        {
            return first
                .Concat(second)
                .GroupBy(kvp => kvp.Key)
                .ToDictionary(g => g.Key, g => g.Last().Value);
        }


        public static Dictionary<string, string> ObjectToDictionary<T>(T obj, string? parentPrefix = null)
        {
            var dict = new Dictionary<string, string>();
            if (obj == null) return dict;

            var type = obj.GetType();
            foreach (var prop in type.GetProperties())
            {
                var value = prop.GetValue(obj);
                var key = string.IsNullOrEmpty(parentPrefix) ? prop.Name : $"{parentPrefix}.{prop.Name}";

                if (value == null)
                {
                    dict[key] = string.Empty;
                }
                else if (prop.PropertyType.IsPrimitive || prop.PropertyType == typeof(string) || prop.PropertyType.IsEnum)
                {
                    dict[key] = value.ToString() ?? string.Empty;
                }
                else if (typeof(System.Collections.IEnumerable).IsAssignableFrom(prop.PropertyType) && prop.PropertyType != typeof(string))
                {
                    int idx = 0;
                    foreach (var item in (System.Collections.IEnumerable)value)
                    {
                        var nestedDict = ObjectToDictionary(item, $"{key}[{idx}]");
                        foreach (var kvp in nestedDict)
                            dict[kvp.Key] = kvp.Value;
                        idx++;
                    }
                }
                else
                {
                    var nestedDict = ObjectToDictionary(value, key);
                    foreach (var kvp in nestedDict)
                        dict[kvp.Key] = kvp.Value;
                }
            }
            return dict;
        }

        public static void AddRangeWithoutOverwrite<TKey, TValue>(Dictionary<TKey, TValue> target, Dictionary<TKey, TValue> source)
        {
            foreach (var kvp in source)
            {
                if (!target.ContainsKey(kvp.Key))
                {
                    target.Add(kvp.Key, kvp.Value);
                }
            }
        }


        public class InitCapNamingStrategy : NamingStrategy
        {
            protected override string ResolvePropertyName(string name)
            {
                return name;
            }
        }

    }
}