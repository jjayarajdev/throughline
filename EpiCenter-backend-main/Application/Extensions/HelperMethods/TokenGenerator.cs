using System.Reflection;

namespace EpicenterX.Application.Extensions.HelperMethods
{
    public static class TokenGenerator
    {
        public static Dictionary<string, string> GenerateTokens(params Type[] types)
        {
            var visited = new HashSet<Type>();
            return types
                .SelectMany(type => GenerateTokensFromType(type, visited, type.Name))
                .ToDictionary(k => k.Key, v => v.Value);
        }

        private static IEnumerable<KeyValuePair<string, string>> GenerateTokensFromType(
            Type type, HashSet<Type> visited, string parentName)
        {
            if (visited.Contains(type))
                yield break;

            visited.Add(type);

            foreach (var prop in type.GetProperties())
            {
                if (IsSkippable(prop, parentName))
                    continue;

                var propType = prop.PropertyType;

                if (propType.IsClass && propType != typeof(string) &&
                    !typeof(System.Collections.IEnumerable).IsAssignableFrom(propType))
                {
                    // Avoid circular reference
                    if (visited.Contains(propType))
                        continue;

                    foreach (var childProp in propType.GetProperties())
                    {
                        if (IsSkippable(childProp, prop.Name))
                            continue;

                        yield return new KeyValuePair<string, string>($"{prop.Name}{childProp.Name}",
                            $"{{{parentName}.{prop.Name}.{childProp.Name}}}"
                        );
                    }

                    visited.Remove(propType); // Optional: allow re-entering this type in other branches
                }
                else
                {
                    yield return new KeyValuePair<string, string>(prop.Name,
                        $"{{{parentName}.{prop.Name}}}"
                       
                    );
                }
            }
        }

        private static bool IsSkippable(PropertyInfo prop, string parentName)
        {
            var skippableNames = new[]
            {
        "Id",
        $"{parentName}Id",
        "IsActive",
        "CreatedBy",
        "CreatedAt",
        "UpdatedBy",
        "UpdatedAt",
        "PasswordHash",
        "Username",
        "UserId",
        "FirstName",
        "MiddleName",
        "LastName"
    };

            if (skippableNames.Contains(prop.Name))
                return true;

            if (typeof(System.Collections.IEnumerable).IsAssignableFrom(prop.PropertyType) &&
                prop.PropertyType != typeof(string))
                return true;

            return false;
        }


        public static Dictionary<string, string> GenerateTokens<T1, T2>()
        {
            return GenerateTokens(typeof(T1), typeof(T2));
        }

        public static Dictionary<string, string> GenerateTokens<T1>()
        {
            return GenerateTokens(typeof(T1));
        }
    }



}
