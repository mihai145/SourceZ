#include <fstream>

using namespace std;

ifstream cin("adunare.in");
ofstream cout("adunare.out");

int main()
{
    int a, b;
    cin >> a >> b;
    cout << a + b << '\n';
    return 0;
}