#include <fstream>

using namespace std;

ifstream cin("adunare.in");
ofstream cout("adunare.out");

int main()
{
    long long a, b;
    cin >> a >> b;
    cout << a + b;
    return 0;
}
